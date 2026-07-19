// URLs das plantas do Brisas do Japi. Antes eram data: URIs base64 inline
// (~270KB decodificados, ~360KB de base64 no bundle JS carregado no First Load).
// Convertidas para arquivos estáticos em public/brisas-do-japi/ — saem do bundle
// JS e passam a carregar como imagens (lazy, cacheáveis pela CDN). Visual
// idêntico (mesmos JPEGs). Mantém a mesma interface (p34/p49/p52/p66) para não
// alterar o componente.
export const p34 = '/brisas-do-japi/planta-p34.jpg';
export const p49 = '/brisas-do-japi/planta-p49.jpg';
export const p52 = '/brisas-do-japi/planta-p52.jpg';
export const p66 = '/brisas-do-japi/planta-p66.jpg';
