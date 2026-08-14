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
2. TEXTOS RICOS E DETALHADOS: Escreva explicações detalhadas, textos longos e encorajadores em português. Não resuma demais os parágrafos. A família gosta de explicações ricas.
3. PARÁGRAFOS DO OBJETIVO: Escreva o campo "objective" detalhadamente em 2 ou 3 parágrafos explicativos e ricos. Cada parágrafo será numerado automaticamente no site como um artigo, então garanta que fluam de forma lógica.
4. SEM ENCERRAMENTO/ORAÇÃO: Não inclua nenhuma oração, encerramento ou consideração final.
`;

// ─── DuckDuckGo CORS Proxy Search Helper (Com Fallback) ────────────────────

export const searchJwLinks = async (query: string): Promise<JwLink[]> => {
  const targetUrl = `https://html.duckduckgo.com/html/?q=site:jw.org ${query}`;
  
  // Lista de proxies CORS públicos para tentar em sequência caso um falhe ou dê timeout (408)
  const proxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];
  
  let html = '';
  for (const getProxyUrl of proxies) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      console.log('Tentando proxy de busca:', proxyUrl);
      
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6s timeout per proxy
      
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(id);
      
      if (response.ok) {
        const text = await response.text();
        if (text && (text.includes('result__link') || text.includes('result__snippet'))) {
          html = text;
          console.log('Busca realizada com sucesso via proxy.');
          break;
        }
      }
    } catch (err) {
      console.warn('Falha no fetch do proxy, tentando próximo da fila...', err);
    }
  }
  
  if (!html) {
    console.error('Todos os proxies de busca falharam.');
    return [];
  }
  
  try {
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
        console.error('Erro ao processar link DuckDuckGo:', e);
      }
    }
    return links;
  } catch (error) {
    console.error('Erro de análise no scraper do DuckDuckGo:', error);
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
    ? `DINÂMICA JÁ DEFINIDA PELA FAMÍLIA: "${customDynamic}"\n→ Incorpore e descreva o passo a passo detalhado desta dinâmica no roteiro.`
    : `DINÂMICA: A família não escolheu uma dinâmica.\n→ Sugira e detalhe o passo a passo de uma dinâmica envolvente e prática para três adultos relacionada ao assunto.`;

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
  "objective": "Escreva 2 ou 3 parágrafos longos, detalhados e ricos sobre o tema. Use emojis. Explique de forma profunda, porém com tom de sugestão, a importância deste assunto para os cristãos hoje.",
  
  "bibleVerses": [
    { 
      "reference": "Livro capítulo:versículo", 
      "text": "Texto completo do versículo na Tradução do Novo Mundo em Português"
    }
  ],
  
  "discussionQuestions": [
    { 
      "question": "Pergunta reflexiva detalhada?",
      "hint": "Ideia explicativa de reflexão prática baseada no tema para ajudar na conversa"
    }
  ],
  
  "dynamic": "Descreva detalhadamente em vários parágrafos o passo a passo da dinâmica, materiais necessários e como aplicá-la com três adultos de forma envolvente.",
  
  "jwLinks": [
    {
      "title": "Copie o Título exato fornecido acima",
      "url": "Copie a URL exata fornecida acima",
      "description": "Explicação curta de 1 frase da utilidade deste link."
    }
  ]
}

REGRAS RÍGIDAS:
1. "objective": Explique em 2 ou 3 parágrafos ricos e detalhados. Não abrevie nem resuma demais.
2. "bibleVerses": Forneça de 3 a 5 versículos bíblicos altamente relevantes e bem explicados.
3. "discussionQuestions": Sugira de 3 a 5 perguntas interessantes para a família meditar.
4. "jwLinks": Coloque apenas os links que foram listados no contexto acima. Se não houver links, deixe o array vazio [].
5. NÃO use markdown (como **negrito**, # títulos, etc.) dentro das propriedades do JSON. Use apenas texto plano.
6. NUNCA cite nomes de pessoas específicas e nunca fale como "dirigente" ou "presidente" da adoração. Não inclua oração ou encerramento.
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
