import { GoogleGenAI } from '@google/genai';
import type { GeneratedContent, Week, WeekType, JwLink } from '../types';
import { WEEK_TYPE_LABELS } from '../types';

// ─── Base de Conhecimento ──────────────────────────────────────────────────
// Diretrizes para estruturar os roteiros da adoração em família.

const FAMILY_WORSHIP_KNOWLEDGE = `
Você é um instrutor de adoração em família para as Testemunhas de Jeová.
Seu papel é criar roteiros de adoração dinâmicos, espirituais, calorosos e práticos.

━━━ DIRETRIZES ESTRUTURAIS ━━━
1. AMBIENTE: Descontraído, caloroso e participativo (três adultos: Rafael, Gracy e Ricardo).
2. TONE: Espiritual, encorajador, instrutivo, respeitoso e acolhedor.
3. OBJETIVO: Fazer com que o tema se aplique de forma prática na rotina diária cristã.
4. PARÁGRAFOS DO OBJETIVO: Escreva o campo "objective" em 2 ou 3 parágrafos curtos e calorosos. Cada parágrafo será numerado automaticamente no site como um artigo, então garanta que fluam bem de forma lógica.
5. DINÂMICA: Proponha uma atividade interativa apropriada para três adultos. Seja prático.
`;

// ─── DuckDuckGo CORS Proxy Search Helper ────────────────────────────────────

export const searchJwLinks = async (query: string): Promise<JwLink[]> => {
  try {
    const targetUrl = `https://html.duckduckgo.com/html/?q=site:jw.org ${query}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return [];
    
    const html = await response.text();
    
    // Regex to match DuckDuckGo HTML links and titles
    const regex = /class="result__link" href="[^"]*uddg=([^&"]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    const links: JwLink[] = [];
    let match;
    
    while ((match = regex.exec(html)) !== null && links.length < 4) {
      try {
        const rawUrl = decodeURIComponent(match[1]);
        const title = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); // strip html tags & double spaces
        
        if (rawUrl.includes('jw.org') && !links.some(l => l.url === rawUrl)) {
          const type = rawUrl.includes('/videos/') ? 'video' :
                       rawUrl.includes('/biblioteca/revistas/') ? 'artigo' : 'estudo';
          const prefix = type === 'video' ? '[VIDEO]' : type === 'artigo' ? '[ARTIGO]' : '[ESTUDO]';
          links.push({
            title: title || 'Artigo no jw.org',
            url: rawUrl,
            description: `${prefix} Recurso oficial complementar sobre ${query}.`
          });
        }
      } catch (e) {
        console.error('Error parsing DuckDuckGo match:', e);
      }
    }
    return links;
  } catch (error) {
    console.error('DuckDuckGo search scraper failed:', error);
    return [];
  }
};

// ─── Construtor de Prompt ──────────────────────────────────────────────────

const buildPrompt = (week: Partial<Week>, realLinks: JwLink[]): string => {
  const { theme = '', type, description = '', customDynamic = '' } = week;

  let typeContext = '';
  switch (type as WeekType) {
    case 'theme':
      typeContext = `TEMA DA ADORAÇÃO: "${theme}"\nTipo: Estudo bíblico temático sobre este assunto específico.`;
      break;
    case 'broadcast':
      typeContext = 'TIPO: JW Broadcasting — a família assistirá ao programa do mês no tv.jw.org e depois debaterá.';
      break;
    case 'meeting_prep':
      typeContext = 'TIPO: Preparação de Reunião — estudo do material da Reunião Vida e Ministério da semana.';
      break;
    case 'free':
      typeContext = `TIPO: Adoração Livre — foco em dinâmica, projeto criativo ou atividade especial.${theme ? `\nAssunto: "${theme}".` : ''}`;
      break;
  }

  const dynamicSection = customDynamic
    ? `DINÂMICA JÁ DEFINIDA PELA FAMÍLIA: "${customDynamic}"\n→ Incorpore e descreva o passo a passo desta dinâmica no roteiro.`
    : `DINÂMICA: A família não escolheu uma dinâmica.\n→ Crie uma dinâmica simples e prática para três adultos sobre o assunto.`;

  const descSection = description
    ? `CONTEXTO ADICIONAL: "${description}"\n→ Considere este contexto ao formular o roteiro.`
    : '';

  // Format scraped real links to enforce strictly in the JSON
  const linksContext = realLinks.length > 0
    ? `VOCÊ DEVE USAR OS SEGUINTES LINKS REAIS DO JW.ORG NO CAMPO "jwLinks" DO JSON. NÃO INVENTE NENHUM OUTRO:
${realLinks.map((l, i) => `${i + 1}. Título: "${l.title}" | URL: "${l.url}" | Descrição: "${l.description}"`).join('\n')}`
    : `NÃO HÁ LINKS REAIS DISPONÍVEIS AGORA. Deixe o campo "jwLinks" vazio como um array vazio [].`;

  return `
${typeContext}
${descSection ? '\n' + descSection : ''}

${dynamicSection}

${linksContext}

━━━ TAREFA DO RETORNO ━━━

Retorne APENAS um JSON válido, sem texto antes ou depois, seguindo esta estrutura exata:

{
  "objective": "Introdução calorosa de 2-3 parágrafos curtos sobre o tema. Use emojis. Explique por que este tema é relevante.",
  
  "bibleVerses": [
    { 
      "reference": "Livro capítulo:versículo", 
      "text": "Texto completo do versículo na Tradução do Novo Mundo"
    }
  ],
  
  "discussionQuestions": [
    { 
      "question": "Pergunta aberta e reflexiva?",
      "hint": "Ponto para desenvolvimento ou ângulo de resposta"
    }
  ],
  
  "dynamic": "Passo a passo numerado da dinâmica e aplicação.",
  
  "closingThought": "Consideração final motivadora de 1 parágrafo com sugestão de oração temática.",
  
  "jwLinks": [
    {
      "title": "Copie o Título exato fornecido acima",
      "url": "Copie a URL exata fornecida acima",
      "type": "artigo | video | estudo",
      "description": "Explicação curta de 1 frase da utilidade deste link."
    }
  ]
}

REGRAS RÍGIDAS:
1. "bibleVerses": 3 a 4 versículos bíblicos.
2. "discussionQuestions": 3 a 5 perguntas reflexivas.
3. "jwLinks": Coloque apenas os links que foram listados no contexto acima. Se não houver links, deixe o array vazio [].
4. NÃO use markdown (como **negrito**, # títulos, etc.) dentro das propriedades do JSON. Use apenas texto plano.
`;
};

// ─── Geração de Conteúdo ───────────────────────────────────────────────────

export const generateFamilyWorshipContent = async (
  apiKey: string,
  week: Partial<Week>,
  modelName?: string
): Promise<GeneratedContent> => {
  if (!apiKey) {
    throw new Error(
      'Chave da API do Gemini não configurada. Acesse as Configurações para adicionar sua chave.'
    );
  }

  const queryTopic = week.theme || WEEK_TYPE_LABELS[week.type || 'theme'] || 'estudo bíblico';
  
  // 1. Fetch real links via DuckDuckGo and CORS proxy asynchronously
  const realLinks = await searchJwLinks(queryTopic);

  // 2. Initialize Gemini API Client
  const ai = new GoogleGenAI({ apiKey });

  // 3. Make the API Call to Gemini
  const response = await ai.models.generateContent({
    model: modelName || 'gemini-3.5-flash',
    contents: FAMILY_WORSHIP_KNOWLEDGE + '\n\n' + buildPrompt(week, realLinks),
    config: {
      temperature: 0.75,
    },
  });

  const text = response.text ?? '';

  // Extract JSON structure from the markdown block response
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error('A IA não retornou um roteiro válido. Tente novamente.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  } catch (err) {
    throw new Error('O formato retornado pela IA está corrompido. Tente novamente.');
  }

  // Ensure fallback structure constraints are filled safely
  return {
    objective: parsed.objective || 'Reflexão sobre o tema selecionado.',
    bibleVerses: parsed.bibleVerses || [],
    discussionQuestions: parsed.discussionQuestions || [],
    dynamic: parsed.dynamic || 'Atividade de reflexão familiar conjunta.',
    closingThought: parsed.closingThought || 'Oração de encerramento.',
    jwLinks: parsed.jwLinks || [],
    generatedAt: new Date().toISOString(),
    themeUsed: week.theme || '',
  };
};
