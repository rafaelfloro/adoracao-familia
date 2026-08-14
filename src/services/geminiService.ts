import { GoogleGenAI } from '@google/genai';
import type { GeneratedContent, Week, WeekType, JwLink } from '../types';
import { WEEK_TYPE_LABELS } from '../types';

// ─── Base de Conhecimento ──────────────────────────────────────────────────
// Diretrizes para estruturar os roteiros da adoração em família.

const FAMILY_WORSHIP_KNOWLEDGE = `
Você é um assistente de sugestões para adoração em família das Testemunhas de Jeová.
Seu papel NÃO é conduzir a reunião nem ensinar verdades bíblicas diretamente, mas sim sugerir ideias práticas de pesquisa, dinâmicas e links do site oficial jw.org.

━━━ DIRETRIZES DE ESTILO ━━━
1. TOM SUGESTIVO: Use sempre um tom de sugestão (ex: "Sugestão de dinâmica", "Ideias para conversar"). Nunca fale como se fosse o dirigente ou instrutor da adoração. Nunca use a primeira pessoa do plural ("nós", "vamos fazer") nem cite nomes específicos de membros da família.
2. CONCISÃO MÁXIMA: Escreva de forma extremamente curta e objetiva. Evite parágrafos longos, explicações doutrinais complexas ou discursos.
3. PAPEL DA IA: Você fornece apenas ideias secundárias e pontos de partida. Os membros da família usarão o site jw.org para o estudo real.
4. SEM ENCERRAMENTO/ORAÇÃO: Não inclua nenhuma oração, encerramento ou consideração final.
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
          links.push({
            title: title || 'Artigo no jw.org',
            url: rawUrl,
            description: `[${type.toUpperCase()}] Recurso oficial complementar sobre ${query}.`
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
  "objective": "Breve resumo de 1 ou 2 frases curtas sobre o propósito de conversar sobre este tema. Use emojis. Exemplo: '💡 Sugestões de pontos de reflexão sobre como fortalecer a fé e lidar com dúvidas diárias.'",
  
  "bibleVerses": [
    { 
      "reference": "Livro capítulo:versículo", 
      "text": "Texto completo do versículo na Tradução do Novo Mundo"
    }
  ],
  
  "discussionQuestions": [
    { 
      "question": "Pergunta curta e simples?",
      "hint": "Ideia muito curta de reflexão baseada no tema"
    }
  ],
  
  "dynamic": "Sugestão prática de dinâmica para adultos (máximo 2 parágrafos curtos).",
  
  "jwLinks": [
    {
      "title": "Copie o Título exato fornecido acima",
      "url": "Copie a URL exata fornecida acima",
      "description": "Explicação curta de 1 frase da utilidade deste link."
    }
  ]
}

REGRAS RÍGIDAS:
1. "objective": Máximo 2 frases curtas. Não escreva textos doutrinais ou discursos bíblicos.
2. "bibleVerses": Apenas 2 ou 3 versículos altamente relevantes.
3. "discussionQuestions": Apenas 2 ou 3 perguntas reflexivas curtas.
4. "jwLinks": Coloque apenas os links que foram listados no contexto acima. Se não houver links, deixe o array vazio [].
5. NÃO use markdown (como **negrito**, # títulos, etc.) dentro das propriedades do JSON. Use apenas texto plano.
6. NUNCA cite nomes de pessoas e nunca fale como "dirigente" da adoração. Não inclua oração ou encerramento.
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
    objective: parsed.objective || 'Sugestões de pontos de meditação.',
    bibleVerses: parsed.bibleVerses || [],
    discussionQuestions: parsed.discussionQuestions || [],
    dynamic: parsed.dynamic || 'Atividade prática de reflexão familiar.',
    closingThought: parsed.closingThought || '',
    jwLinks: parsed.jwLinks || [],
    generatedAt: new Date().toISOString(),
    themeUsed: week.theme || '',
  };
};
