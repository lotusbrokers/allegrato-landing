/**
 * Vídeo "Morar em <bairro>, <cidade>" do YouTube num guia de bairro.
 *
 * O espaço foi preparado em 12/11/2026 (Radar Competitivo C9), antes de haver
 * vídeo: sem `video` no cadastro do bairro (lib/bairros.ts), a seção e o
 * VideoObject simplesmente não aparecem. Para publicar, basta preencher
 * `video: { youtubeId, publicadoEm }` no bairro, começando por Engordadouro e
 * Malota. Nada é embutido antes de o vídeo existir.
 *
 * O player só carrega no clique (miniatura + botão): o iframe do YouTube pesa
 * mais de 1 MB de JavaScript e entraria no LCP do guia.
 *
 * Módulo puro: usado pelo componente (navegador), pela rota (JSON-LD) e pelo
 * teste.
 */

export type VideoDoBairroCadastro = {
  /** O id de 11 caracteres da URL do YouTube (watch?v=<id>). */
  youtubeId: string;
  /** Dia em que o vídeo foi publicado no YouTube (AAAA-MM-DD). O Google exige. */
  publicadoEm: string;
  /** Texto do VideoObject; sem ele, vai uma frase-padrão com o nome do bairro. */
  descricao?: string;
};

const ID_DO_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

export function videoDoBairro(bairro: { nome: string; cidade: string; video?: VideoDoBairroCadastro }) {
  const video = bairro.video;
  if (!video || !ID_DO_YOUTUBE.test(video.youtubeId) || Number.isNaN(Date.parse(video.publicadoEm))) return null;
  const id = video.youtubeId;
  const titulo = `Morar em ${bairro.nome}, ${bairro.cidade}`;
  const descricao = video.descricao ?? `${titulo}: como é viver no bairro, em vídeo da Lotus Brokers.`;
  return {
    titulo,
    miniatura: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    // youtube-nocookie: o YouTube só grava cookie depois que a pessoa dá o play.
    player: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: titulo,
      description: descricao,
      thumbnailUrl: [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`],
      uploadDate: video.publicadoEm,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      url: `https://www.youtube.com/watch?v=${id}`,
    },
  };
}
