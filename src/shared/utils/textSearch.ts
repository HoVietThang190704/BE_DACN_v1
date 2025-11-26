const SPECIAL_REGEX_CHARS = /[.*+?^${}()|[\]\\]/g;

const VIETNAMESE_CHAR_GROUPS: Record<string, string> = {
  a: 'aàáạảãâầấậẩẫăằắặẳẵ',
  e: 'eèéẹẻẽêềếệểễ',
  i: 'iìíịỉĩ',
  o: 'oòóọỏõôồốộổỗơờớợởỡ',
  u: 'uùúụủũưừứựửữ',
  y: 'yỳýỵỷỹ',
  d: 'dđ',
  c: 'c',
  h: 'h',
  k: 'k',
  g: 'g',
  q: 'q',
  n: 'n',
  t: 't',
  l: 'l',
  m: 'm',
  p: 'p',
  r: 'r',
  s: 's',
  v: 'v',
  b: 'b'
};

export const normalizeVietnameseText = (value: string): string => {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const escapeRegexChar = (char: string): string => char.replace(SPECIAL_REGEX_CHARS, '\\$&');

export const buildVietnameseRegexPattern = (term: string): string => {
  const trimmed = term.trim();
  if (!trimmed) {
    return '';
  }

  let pattern = '';
  for (const char of trimmed) {
    if (/\s/.test(char)) {
      pattern += '\\s+';
      continue;
    }

    const lower = char.toLowerCase();
    const group = VIETNAMESE_CHAR_GROUPS[lower];

    if (group) {
      const chars = group + group.toUpperCase();
      pattern += `[${chars}]`;
    } else {
      pattern += escapeRegexChar(char);
    }
  }

  return pattern;
};

export const buildVietnameseRegex = (term: string, flags: string = 'i'): RegExp => {
  const pattern = buildVietnameseRegexPattern(term);
  if (!pattern) {
    return new RegExp('', flags);
  }
  return new RegExp(pattern, flags);
};

const splitIntoTokens = (value: string): string[] => value
  .split(/[\s,.;:'"()\[\]{}!@#$%^&*+\-=\\/|<>?]+/)
  .map(token => token.trim())
  .filter(token => token.length > 0);

const addTokenVariants = (token: string, target: Set<string>) => {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }

  const normalized = normalizeVietnameseText(trimmed);
  const variants = [trimmed, trimmed.toLowerCase(), normalized, normalized.toLowerCase()];

  for (const variant of variants) {
    if (variant.length > 1) {
      target.add(variant);
    }
  }
};

export const buildSearchTokens = (...values: Array<string | undefined | null>): string[] => {
  const tokens = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    addTokenVariants(trimmed, tokens);

    for (const part of splitIntoTokens(trimmed)) {
      addTokenVariants(part, tokens);
    }
  }

  return Array.from(tokens).slice(0, 64);
};
