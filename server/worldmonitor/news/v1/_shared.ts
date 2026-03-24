// ========================================================================
// Constants
// ========================================================================

export const CACHE_TTL_SECONDS = 86400; // 24 hours

// ========================================================================
// Shared cache-key logic (used by both server handler and client GET lookup)
// ========================================================================

export {
  CACHE_VERSION,
  canonicalizeSummaryInputs,
  buildSummaryCacheKey,
  buildSummaryCacheKey as getCacheKey,
} from '../../../../src/utils/summary-cache-key';

// ========================================================================
// Hash utility (unified FNV-1a 52-bit -- H-7 fix)
// ========================================================================

import { hashString } from '../../../_shared/hash';
export { hashString };

// ========================================================================
// Headline deduplication (used by SummarizeArticle)
// ========================================================================

// @ts-ignore -- plain JS module, no .d.mts needed for this pure function
export { deduplicateHeadlines } from './dedup.mjs';

// ========================================================================
// SummarizeArticle: Full prompt builder (ported from _summarize-handler.js)
// ========================================================================

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  he: 'Hebrew',
  pt: 'Portuguese',
  ru: 'Russian',
  bg: 'Bulgarian',
  cs: 'Czech',
  el: 'Greek',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  pl: 'Polish',
  ro: 'Romanian',
  sv: 'Swedish',
  th: 'Thai',
  vi: 'Vietnamese',
  zh: 'Chinese',
};

function getLanguageInstruction(lang: string): string {
  const normalized = typeof lang === 'string' && lang ? lang.toLowerCase().split('-')[0]! : 'en';
  if (normalized === 'en') return '';
  const label = LANGUAGE_LABELS[normalized] || normalized.toUpperCase();
  let instruction = `\nIMPORTANT: Output ONLY in ${label}. Do not use any other language.`;
  if (normalized === 'ar' || normalized === 'he') {
    instruction += ` Do NOT start with phrases like "This is the current situation", "هذه هي الوضع الحالي", or similar meta-commentary — start directly with the summary content.`;
    instruction += ` Only state facts explicitly stated in the headlines. Do NOT invent names, places, numbers, or context not present in the text.`;
  }
  return instruction;
}

/** "Not selected" phrases the LLM may output for headlines it did not pick. */
const NOT_SELECTED_PHRASES =
  /^(?:seçilmedi|not selected|non sélectionné|nicht ausgewählt|no seleccionado|non selezionato|未被选中|未选择|선택되지 않음|não selecionado|не выбрано)\.?\s*$/i;

/**
 * Clean malformed summary: numbered lists ("1. ..."), "Seçilmedi" lines, etc.
 * Keeps only the first substantial summary.
 */
export function sanitizeSummary(text: string): string {
  if (typeof text !== 'string') return '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return text.trim();
  const result: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.\s*(.+)$/);
    if (m) {
      const rest = m[1]!.trim();
      if (NOT_SELECTED_PHRASES.test(rest)) continue;
      if (result.length > 0) break;
      result.push(rest);
    } else {
      if (result.length > 0) break;
      result.push(line);
    }
  }
  const joined = result.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length >= 20 ? joined : text.trim();
}

export function buildArticlePrompts(
  headlines: string[],
  uniqueHeadlines: string[],
  opts: { mode: string; geoContext: string; variant: string; lang: string },
): { systemPrompt: string; userPrompt: string } {
  const headlineText = uniqueHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n');
  const intelSection = opts.geoContext ? `\n\n${opts.geoContext}` : '';
  const isTechVariant = opts.variant === 'tech';
  const dateContext = `Current date: ${new Date().toISOString().split('T')[0]}.${isTechVariant ? '' : ' Provide geopolitical context appropriate for the current date.'}`;
  const langInstruction = getLanguageInstruction(opts.lang);

  let systemPrompt: string;
  let userPrompt: string;

  if (opts.mode === 'brief') {
    if (isTechVariant) {
      systemPrompt = `${dateContext}

Summarize the single most important tech/startup headline in 2 concise sentences MAX (under 60 words total).
Rules:
- Each numbered headline below is a SEPARATE, UNRELATED story
- Pick the ONE most significant headline and summarize ONLY that story
- Output ONLY your 2-sentence summary. Do NOT output a numbered list. Do NOT write "Seçilmedi", "Not selected", or similar
- NEVER combine or merge facts, names, or details from different headlines
- Focus ONLY on technology, startups, AI, funding, product launches, or developer news
- IGNORE political news, trade policy, tariffs, government actions unless directly about tech regulation
- Lead with the company/product/technology name
- Only state facts explicitly in the headlines — do not invent names, numbers, or context
- No bullet points, no meta-commentary, no elaboration beyond the core facts${langInstruction}`;
    } else {
      systemPrompt = `${dateContext}

Summarize the single most important headline in 2 concise sentences MAX (under 60 words total).
Rules:
- Each numbered headline below is a SEPARATE, UNRELATED story
- Pick the ONE most significant headline and summarize ONLY that story
- Output ONLY your 2-sentence summary. Do NOT output a numbered list. Do NOT write "Seçilmedi", "Not selected", or similar
- NEVER combine or merge people, places, or facts from different headlines into one sentence
- Lead with WHAT happened and WHERE - be specific
- NEVER start with "Breaking news", "Good evening", "Tonight", or TV-style openings
- Start directly with the subject of the chosen headline
- If intelligence context is provided, use it only if it relates to your chosen headline
- Only state facts explicitly in the headlines — do not invent names, numbers, or context
- No bullet points, no meta-commentary, no elaboration beyond the core facts${langInstruction}`;
    }
    userPrompt = `Each headline below is a separate story. Pick the most important ONE and summarize only that story:\n${headlineText}${intelSection}`;
  } else if (opts.mode === 'analysis') {
    if (isTechVariant) {
      systemPrompt = `${dateContext}

Analyze the most significant tech/startup development in 2 concise sentences MAX (under 60 words total).
Rules:
- Each numbered headline below is a SEPARATE, UNRELATED story
- Pick the ONE most significant story and analyze ONLY that
- Output ONLY your 2-sentence analysis. Do NOT output a numbered list. Do NOT write "Seçilmedi", "Not selected", or similar
- NEVER combine facts from different headlines
- Focus ONLY on technology implications: funding trends, AI developments, market shifts, product strategy
- IGNORE political implications, trade wars, government unless directly about tech policy
- Only state facts explicitly in the headlines — do not invent or assume details
- Lead with the insight, no filler or elaboration${langInstruction}`;
    } else {
      systemPrompt = `${dateContext}

Analyze the most significant development in 2 concise sentences MAX (under 60 words total). Be direct and specific.
Rules:
- Each numbered headline below is a SEPARATE, UNRELATED story
- Pick the ONE most significant story and analyze ONLY that
- Output ONLY your 2-sentence analysis. Do NOT output a numbered list. Do NOT write "Seçilmedi", "Not selected", or similar
- NEVER combine or merge people, places, or facts from different headlines
- Lead with the insight - what's significant and why
- NEVER start with "Breaking news", "Tonight", "The key/dominant narrative is"
- Start with substance, no filler or elaboration
- Only state facts explicitly in the headlines — do not invent or assume details
- If intelligence context is provided, use it only if it relates to your chosen headline${langInstruction}`;
    }
    userPrompt = isTechVariant
      ? `Each headline is a separate story. What's the key tech trend?\n${headlineText}${intelSection}`
      : `Each headline is a separate story. What's the key pattern or risk?\n${headlineText}${intelSection}`;
  } else if (opts.mode === 'translate') {
    const targetLang = opts.variant;
    systemPrompt = `You are a professional news translator. Translate the following news headlines/summaries into ${targetLang}.
Rules:
- Maintain the original tone and journalistic style.
- Do NOT add any conversational filler (e.g., "Here is the translation").
- Output ONLY the translated text.
- If the text is already in ${targetLang}, return it as is.`;
    userPrompt = `Translate to ${targetLang}:\n${headlines[0]}`;
  } else {
    systemPrompt = isTechVariant
      ? `${dateContext}\n\nPick the most important tech headline and summarize it in 2 concise sentences (under 60 words). Output ONLY the summary, no numbered list. Each headline is a separate story - NEVER merge facts from different headlines. Focus on startups, AI, funding, products. Ignore politics unless directly about tech regulation.${langInstruction}`
      : `${dateContext}\n\nPick the most important headline and summarize it in 2 concise sentences (under 60 words). Output ONLY the summary, no numbered list. Each headline is a separate, unrelated story - NEVER merge people or facts from different headlines. Lead with substance. NEVER start with "Breaking news" or "Tonight".${langInstruction}`;
    userPrompt = `Each headline is a separate story. Key takeaway from the most important one:\n${headlineText}${intelSection}`;
  }

  return { systemPrompt, userPrompt };
}

// ========================================================================
// SummarizeArticle: Provider credential resolution
// ========================================================================

export interface ProviderCredentials {
  apiUrl: string;
  model: string;
  headers: Record<string, string>;
  extraBody?: Record<string, unknown>;
}

export function getProviderCredentials(provider: string): ProviderCredentials | null {
  if (provider === 'ollama') {
    const baseUrl = process.env.OLLAMA_API_URL;
    if (!baseUrl) return null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = process.env.OLLAMA_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    const rawMax = parseInt(process.env.OLLAMA_MAX_TOKENS || '300', 10);
    const ollamaMaxTokens = Number.isFinite(rawMax) ? Math.min(Math.max(rawMax, 50), 2000) : 300;
    return {
      apiUrl: new URL('/v1/chat/completions', baseUrl).toString(),
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
      headers,
      extraBody: { think: false, max_tokens: ollamaMaxTokens },
    };
  }

  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    return {
      apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };
  }

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;
    return {
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'google/gemini-2.5-flash',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://worldmonitor.app',
        'X-Title': 'WorldMonitor',
      },
    };
  }

  return null;
}
