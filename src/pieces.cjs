// TCA's own Staunton drawings. Both sets use the same carved profile and plinth.
const profiles = {
  p: ['M24 45c3-5 5-10 5-15-4-2-6-5-6-9a9 9 0 0 1 18 0c0 4-2 7-6 9 0 5 2 10 5 15Z',
      'M26 32q6 2 12 0'],
  r: ['M19 11h7v6h4v-6h5v6h4v-6h7v13l-5 4 2 17H21l2-17-4-4Z',
      'M22 24h21M25 29h14M27 32l-1 8'],
  n: ['M19 45c2-6 6-10 12-15l2-5-10 5-7 1-4-5 4-7 9-7 1-6 6 4 5-4 1 7c10 6 13 18 9 32Z',
      'M34 15c7 4 11 12 10 20M24 20l3-1M16 26l2-1M27 34l6-5'],
  b: ['M21 45c5-4 7-8 7-12-5-2-8-6-7-11 1-6 7-11 11-16 5 5 12 12 12 18 0 4-3 7-8 9 0 5 3 9 7 12Z',
      'M27 18l7 8M25 33q7 2 14 0'],
  q: ['M18 18l7 7 1-13 6 12 7-12 1 13 7-7-5 16H22Zm5 17h18c-3 4-2 7 0 10H23c2-3 3-6 0-10Z',
      'M23 30q9 3 18 0'],
  k: ['M29 5h6v5h5v5h-5v5c5-5 12-4 13 2 1 5-5 10-9 13-2 4-1 7 2 10H23c3-3 4-6 2-10-5-3-10-8-9-13 1-6 8-7 13-2v-5h-5v-5h5Z',
      'M24 31q8 4 16 0M30 23l2 3 3-3']
};
const plinth = 'M21 44q11 2 22 0l2 3-1 3 4 2 2 5q-18 3-36 0l2-5 4-2-1-3Z';
module.exports = Object.fromEntries(Object.entries(profiles).flatMap(([kind, [body, cut]]) =>
  [true, false].map(white => {
    const id = white ? kind.toUpperCase() : kind;
    const wood = white ? '#fff4df' : '#283549', base = white ? '#ead7b4' : '#243044';
    const edge = white ? '#293142' : '#141c2a', carving = white ? '#75664e' : '#d0d5cf';
    const finials = kind === 'q' ? [[17,16],[26,10],[39,10],[48,16]].map(([x,y]) =>
      '<circle cx="'+x+'" cy="'+y+'" r="2.4"/>').join('') : '';
    return [id, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" data-set="tca-staunton" data-man="'+id+'"><g stroke="'+edge+'" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="'+wood+'"><path d="'+body+'"/>'+finials+
      '<path d="'+plinth+'" fill="'+base+'"/><g fill="none" stroke="'+carving+'" stroke-width="1.8"><path d="'+cut+'"/><path d="M21 50q11 2 22 0M18 55q14 2 28 0"/></g></g></svg>'];
  })));
