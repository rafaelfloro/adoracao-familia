import { GoogleGenAI } from '@google/genai';
import type { GeneratedContent, Week, WeekType } from '../types';

// ─── Base de Conhecimento ──────────────────────────────────────────────────
// Este contexto é APENAS para orientar o Gemini sobre como estruturar uma
// adoração em família. NÃO são fontes para citar — são diretrizes de como
// o roteiro deve ser organizado e conduzido.

const FAMILY_WORSHIP_KNOWLEDGE = `
Você é um especialista em adoração em família para Testemunhas de Jeová.
Seu papel é criar roteiros de adoração em família dinâmicos, calorosos e práticos.

━━━ DIRETRIZES ESTRUTURAIS — COMO DEVE SER A ADORAÇÃO EM FAMÍLIA ━━━

Com base em publicações e experiências de famílias ao redor do mundo:

1. AMBIENTE: Descontraído e informal. Mais uma conversa do que uma aula. 
   Todos participam, interagem e se sentem à vontade para falar.

2. VARIEDADE É O SEGREDO: Divida em múltiplas partes dinâmicas.
   Evite um único formato — alterne leitura, discussão, vídeo, dinâmica, encenação.

3. PREPARAÇÃO PRÉVIA: Quando todos sabem o tema com antecedência, o engajamento é maior.
   Distribua "tarefas" para cada membro — leituras, pesquisas, perguntas.

4. SEJA PRÁTICO: Relacione o tema com situações reais da vida.
   Como isso se aplica no trabalho, nas amizades, nas decisões cotidianas?

5. DINÂMICAS EFICAZES PARA ADULTOS:
   - Debate estruturado: cada pessoa defende um ponto de vista diferente
   - "E se eu fosse...": colocar-se no lugar de personagens bíblicos
   - Pesquisa em equipe: cada um pesquisa um aspecto do tema e apresenta
   - Linha do tempo visual: construir cronologia de eventos bíblicos
   - Quiz bíblico temático com pontuação
   - Encenação de situações do dia a dia relacionadas ao tema
   - Compartilhar: "O que este tema mudou na minha perspectiva?"

6. ESTRUTURA IDEAL DE 60-90 MINUTOS:
   - Abertura com cântico relacionado (5-10 min)
   - Texto bíblico central e reflexão (10-15 min)
   - Discussão com perguntas abertas (15-20 min)
   - Recurso complementar: vídeo, artigo ou projeto (15-20 min)
   - Dinâmica/Atividade prática (15-20 min)
   - Encerramento com oração (5 min)

7. FAMÍLIA FLORO — CONTEXTO ESPECÍFICO:
   - Rafael Floro, Gracy Kelly e Ricardo Floro — três adultos
   - Conteúdo deve ter profundidade intelectual e aplicabilidade prática
   - A adoração deve ser o PONTO ALTO da semana, não uma obrigação
   - Tom: caloroso, motivador, próximo — como conversa entre amigos íntimos

━━━ FIM DAS DIRETRIZES ESTRUTURAIS ━━━
`;

// ─── Construtor de Prompt ──────────────────────────────────────────────────

const buildPrompt = (week: Partial<Week>): string => {
  const { theme = '', type, description = '', customDynamic = '' } = week;

  let typeContext = '';
  switch (type as WeekType) {
    case 'theme':
      typeContext = `TEMA DA ADORAÇÃO: "${theme}"\nTipo: Estudo bíblico temático sobre este assunto específico.`;
      break;
    case 'broadcast':
      typeContext = 'TIPO: JW Broadcasting — a família vai assistir juntos ao programa do mês no tv.jw.org e depois discutir.';
      break;
    case 'meeting_prep':
      typeContext = 'TIPO: Preparação de Reunião — estudo do material da Reunião Vida e Ministério da semana.';
      break;
    case 'free':
      typeContext = `TIPO: Adoração Livre — foco em dinâmica, projeto criativo ou atividade especial.${theme ? `\nAssunto: "${theme}".` : ''}`;
      break;
  }

  const dynamicSection = customDynamic
    ? `DINÂMICA JÁ ESCOLHIDA PELA FAMÍLIA: "${customDynamic}"
→ Incorpore e expanda esta dinâmica no roteiro. Detalhe o passo a passo, tempo estimado e como torná-la mais envolvente para três adultos.`
    : `DINÂMICA: A família não escolheu uma dinâmica ainda.
→ Sugira 1 dinâmica criativa, prática e adequada para três adultos, relacionada ao tema.
→ Detalhe passo a passo de como realizá-la.`;

  const descSection = description
    ? `CONTEXTO ADICIONAL DA FAMÍLIA PARA ESTA SEMANA: "${description}"\n→ Considere este contexto ao criar o roteiro.`
    : '';

  const searchTopic = theme || type || 'adoração em família';

  return `
${typeContext}
${descSection ? '\n' + descSection : ''}

${dynamicSection}

━━━ SUA TAREFA ━━━

Crie um roteiro completo e dinâmico para esta adoração em família.

PASSO OBRIGATÓRIO — PESQUISA COM GOOGLE SEARCH:
Antes de criar o roteiro, use o Google Search para encontrar RECURSOS COMPLEMENTARES REAIS sobre o tema "${searchTopic}":
- Pesquise: site:jw.org "${searchTopic}"
- Pesquise: site:jw.org videos "${searchTopic}"  
- Pesquise: site:tv.jw.org "${searchTopic}"
- Pesquise: site:wol.jw.org "${searchTopic}"

Estes recursos serão usados como LINKS COMPLEMENTARES para enriquecer a adoração em família —
artigos para ler antes, vídeos para assistir juntos, estudos para aprofundar o tema.
NÃO são fontes para copiar texto — são sugestões de material que a família pode explorar.

━━━ FORMATO DA RESPOSTA ━━━

Retorne APENAS um JSON válido, sem texto antes ou depois, com esta estrutura:

{
  "objective": "Introdução calorosa de 3-4 parágrafos sobre o tema. Use emojis. Explique por que este tema é relevante para a vida cristã hoje. Tom próximo e motivador, como se fosse uma conversa.",
  
  "bibleVerses": [
    { 
      "reference": "Livro capítulo:versículo", 
      "text": "Texto completo do versículo na Tradução do Novo Mundo em Português"
    }
  ],
  
  "discussionQuestions": [
    { 
      "question": "Pergunta aberta e reflexiva?",
      "hint": "Ponto para desenvolver ou ângulo interessante de abordagem"
    }
  ],
  
  "dynamic": "Descrição DETALHADA da dinâmica. Inclua: nome da dinâmica, objetivo, materiais necessários (se houver), passo a passo numerado, tempo estimado, e como adaptar para três adultos.",
  
  "closingThought": "Pensamento final encorajador de 2 parágrafos. Conecte o tema com a caminhada espiritual da família. Termine com sugestão de oração temática.",
  
  "jwLinks": [
    {
      "title": "Título exato do artigo, vídeo ou recurso encontrado",
      "url": "URL real e completa encontrada via Google Search",
      "type": "artigo | video | estudo | programa",
      "description": "Por que este recurso complementa bem esta adoração? O que a família vai encontrar nele? (1-2 frases)"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- bibleVerses: EXATAMENTE 4 a 6 versículos, todos relevantes ao tema central
- discussionQuestions: EXATAMENTE 5 a 7 perguntas — variando de reflexivas a práticas
- jwLinks: EXATAMENTE 4 a 7 links — todos REAIS, encontrados via Google Search no jw.org/tv.jw.org/wol.jw.org
  ✅ Inclua mix de: artigos para leitura, vídeos para assistir juntos, estudos para aprofundar
  ✅ URLs devem ser completas e reais — não invente links
  ❌ Não cite artigos que não foram encontrados na pesquisa
- Todo o conteúdo em Português do Brasil
- NÃO use markdown dentro das strings do JSON — apenas texto e quebras de linha (\\n)
- O campo "dynamic" deve ter NO MÍNIMO 150 palavras de detalhamento
- O campo "objective" deve ter NO MÍNIMO 200 palavras, caloroso e envolvente
`;
};

// ─── Geração de Conteúdo ───────────────────────────────────────────────────

export const generateFamilyWorshipContent = async (
  apiKey: string,
  week: Partial<Week>
): Promise<GeneratedContent> => {
  if (!apiKey) {
    throw new Error(
      'Chave da API do Gemini não configurada. Acesse as Configurações para adicionar sua chave.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: FAMILY_WORSHIP_KNOWLEDGE + '\n\n' + buildPrompt(week),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.75,
    },
  });

  const text = response.text ?? '';

  // Extrair JSON da resposta (pode vir com markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    text.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error('A IA não retornou um roteiro válido. Tente novamente.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  } catch {
    // Try to find the outermost JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      parsed = JSON.parse(text.slice(start, end + 1));
    } else {
      throw new Error('Erro ao interpretar o roteiro gerado. Tente novamente.');
    }
  }

  // Extrair fontes do Google Search Grounding
  const groundingSources: string[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
      if (chunk.web?.uri) {
        groundingSources.push(chunk.web.uri);
      }
    }
  }

  return {
    objective: parsed.objective || '',
    bibleVerses: parsed.bibleVerses || [],
    discussionQuestions: parsed.discussionQuestions || [],
    dynamic: parsed.dynamic || '',
    closingThought: parsed.closingThought || '',
    jwLinks: (parsed.jwLinks || []).map((l: any) => ({
      title: l.title || '',
      url: l.url || '',
      description: l.description
        ? `[${l.type?.toUpperCase() || 'RECURSO'}] ${l.description}`
        : '',
    })),
    searchGroundingSources: groundingSources,
    generatedAt: new Date().toISOString(),
    themeUsed: week.theme || week.type || '',
  };
};
