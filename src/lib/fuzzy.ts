// Typo-tolerant search for quartier names.
//
// Malagasy place names are long ("Ambambihajjaho", "Andrefan'Ambohijanahary")
// and users type them half-remembered: "Ivndr" should still find "Ivandry".
// So matching is layered, best tier first:
//
//   exact > prefix > word-prefix > substring > subsequence > edit distance
//
// Subsequence matching is what rescues dropped vowels ("Ivndr" ->
// "Ivandry"); Levenshtein covers transpositions and typos that break the
// order ("ambtoroka" -> "Ambatoroka").

export type Match = {
  /** Higher is better. */
  score: number;
  /** Indices into the *original* candidate string to highlight. */
  highlight: number[];
};

/** Normalized text plus the original index of each normalized character. */
type Normalized = {
  text: string;
  /** Original index for each character of `text`. */
  origin: number[];
};

/**
 * Lowercases, strips diacritics, and drops everything that is not a letter
 * or a digit. Spaces separate words. Apostrophes vanish so that
 * "Andrefan'Ambohijanahary" also answers to "andrefan ambohijanahary".
 */
export function normalize(input: string): Normalized {
  const parts: { ch: string; idx: number }[] = [];

  for (let i = 0; i < input.length; i += 1) {
    const base = input[i]
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const piece of base) {
      if (/[a-z0-9]/.test(piece)) {
        parts.push({ ch: piece, idx: i });
      } else if (parts.length > 0 && parts[parts.length - 1].ch !== ' ') {
        // Any run of punctuation collapses into one separator.
        parts.push({ ch: ' ', idx: i });
      }
    }
  }

  while (parts.length > 0 && parts[parts.length - 1].ch === ' ') parts.pop();

  return {
    text: parts.map((part) => part.ch).join(''),
    origin: parts.map((part) => part.idx),
  };
}

/** Levenshtein distance, abandoned early when it exceeds `limit`. */
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  if (a === b) return 0;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i, ...new Array<number>(b.length).fill(0)];
    let rowMin = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > limit) return limit + 1;
    previous = current;
  }

  return previous[b.length];
}

/** Edit-distance budget: short names tolerate fewer mistakes. */
function distanceBudget(length: number): number {
  if (length <= 4) return 1;
  if (length <= 7) return 2;
  return 3;
}

/**
 * Greedy subsequence match. Returns the matched positions in `text`, or null
 * when `query` is not a subsequence. Gaps cost, so tight matches win.
 */
function subsequence(query: string, text: string): number[] | null {
  if (query.length === 0) return null;

  const positions: number[] = [];
  let cursor = 0;

  for (let i = 0; i < text.length && cursor < query.length; i += 1) {
    if (text[i] === query[cursor]) {
      positions.push(i);
      cursor += 1;
    }
  }

  return cursor === query.length ? positions : null;
}

/** Words of a normalized string with their offset in that string. */
function splitWords(text: string): { word: string; offset: number }[] {
  const words: { word: string; offset: number }[] = [];
  let start = 0;

  for (let i = 0; i <= text.length; i += 1) {
    if (i === text.length || text[i] === ' ') {
      if (i > start) words.push({ word: text.slice(start, i), offset: start });
      start = i + 1;
    }
  }

  return words;
}

/** Index where `query` prefixes one of the candidate words, or -1. */
function findWordStart(text: string, query: string): number {
  for (const { word, offset } of splitWords(text)) {
    if (word.startsWith(query)) return offset;
  }
  return -1;
}

/** Score one query token against one candidate string. */
function scoreToken(query: string, candidate: Normalized): Match | null {
  if (query.length === 0) return null;
  if (candidate.text.length === 0) return null;

  const text = candidate.text;

  // Exact.
  if (text === query) {
    return { score: 1000, highlight: candidate.origin.slice(0, query.length) };
  }

  // Prefix.
  if (text.startsWith(query)) {
    return { score: 900, highlight: candidate.origin.slice(0, query.length) };
  }

  // Word prefix: the query starts one of the candidate words.
  const wordStart = findWordStart(text, query);
  if (wordStart >= 0) {
    return {
      score: 850,
      highlight: candidate.origin.slice(wordStart, wordStart + query.length),
    };
  }

  // Substring anywhere.
  const at = text.indexOf(query);
  if (at >= 0) {
    return {
      score: 800,
      highlight: candidate.origin.slice(at, at + query.length),
    };
  }

  // Subsequence: characters in order, gaps allowed.
  const positions = subsequence(query, text);
  if (positions) {
    const spread = positions[positions.length - 1] - positions[0] + 1;
    const gaps = spread - query.length;
    return {
      score: Math.max(400, 700 - gaps * 12),
      highlight: positions.map((pos) => candidate.origin[pos]),
    };
  }

  // Edit distance: transposition, doubled letter, wrong vowel.
  const budget = distanceBudget(query.length);
  const distance = editDistance(query, text, budget);
  if (distance <= budget) {
    return { score: 600 - distance * 100, highlight: [] };
  }

  return null;
}

/**
 * Matches a whole query (possibly several words) against a candidate.
 *
 * Every query token must match on its own; the candidate scores the sum of
 * its best token scores. Returns null when any token fails to match.
 */
export function matchQuery(query: string, candidate: string): Match | null {
  const normalizedCandidate = normalize(candidate);
  const tokens = normalize(query).text.split(' ').filter(Boolean);

  if (tokens.length === 0) return { score: 0, highlight: [] };

  const options: Normalized[] = [
    normalizedCandidate,
    ...splitWords(normalizedCandidate.text).map(({ word, offset }) => ({
      text: word,
      origin: normalizedCandidate.origin.slice(offset, offset + word.length),
    })),
  ];

  let total = 0;
  const highlight = new Set<number>();

  for (const token of tokens) {
    let best: Match | null = null;

    for (const option of options) {
      const match = scoreToken(token, option);
      if (match && (!best || match.score > best.score)) best = match;
    }

    if (!best) return null;

    total += best.score;
    best.highlight.forEach((index) => highlight.add(index));
  }

  return {
    score: total,
    highlight: [...highlight].sort((a, b) => a - b),
  };
}

export type Scored<T> = {
  item: T;
  score: number;
  /** Indices into the original name to highlight. */
  highlight: number[];
};

/**
 * Ranks `items` against `query`. An empty query keeps the incoming order.
 */
export function searchByName<T extends { name: string }>(
  query: string,
  items: T[],
): Scored<T>[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return items.map((item) => ({ item, score: 0, highlight: [] }));
  }

  const scored: Scored<T>[] = [];

  for (const item of items) {
    const match = matchQuery(trimmed, item.name);
    if (match) {
      scored.push({ item, score: match.score, highlight: match.highlight });
    }
  }

  scored.sort(
    (a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name),
  );

  return scored;
}
