export function normalizeProductSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function productNameMatches(productName, query) {
  const normalizedName = normalizeProductSearchText(productName);
  const searchTerms = normalizeProductSearchText(query).split(/\s+/).filter(Boolean);
  return searchTerms.length > 0 && searchTerms.every((term) => normalizedName.includes(term));
}
