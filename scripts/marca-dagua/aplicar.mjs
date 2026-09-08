/**
 * Estampa a marca d'água da Lotus em capas que não passaram pelo dashboard.
 *
 * POR QUE ISTO EXISTE
 *
 * Quem aplica a marca é o dashboard, ao publicar as fotos: elas chegam ao
 * portal já marcadas, com nome `wm_v23_o100_s40_portal.jpg`. Um lançamento sem
 * registro em `portal_lancamentos` (ou com registro sem foto) cai no fallback
 * curado de lib/developments.ts, que aponta para um arquivo local — e esse
 * arquivo nunca passou pelo dashboard, então vinha sem marca. Na vitrine isso
 * aparecia como um card sem marca no meio de 25 com marca.
 *
 * ISTO É PROVISÓRIO. A correção de verdade é cadastrar o lançamento no
 * dashboard e subir as fotos: aí a marca vem de lá, junto com preço, estágio e
 * as fotos reais. Quando isso acontecer, o portal para de usar o arquivo local
 * sozinho — e a linha correspondente pode sair de ALVOS.
 *
 * DE ONDE VEIO A MARCA
 *
 * O dashboard não expõe o arquivo dela: só a versão já composta é pública. A
 * arte em scripts/marca-dagua/lotus-brokers.png foi recuperada das próprias
 * fotos marcadas. A composição é `saída = fundo·(1−a) + 255·a`; onde a marca
 * não está, a saída é o fundo e varia muito de foto para foto, e onde ela está
 * a saída é empurrada para o branco em todas. O mínimo pixel a pixel entre 14
 * fotos 1280x720 deixa o fundo perto do mais escuro que apareceu ali e mantém
 * a marca alta — o que sobra é o alfa dela.
 *
 * A geometria foi conferida sobrepondo a arte recuperada numa foto que já
 * tinha a original: elas coincidem, sem deslocamento nem diferença de tamanho.
 *
 * Uma diferença permanece: a original tem uma sombra suave atrás das letras,
 * que este método não recupera (o mínimo só enxerga a parte clara). Em cima de
 * foto, no tamanho do card, não se nota — mas está registrado aqui.
 *
 * COMO RODAR
 *
 *   node scripts/marca-dagua/aplicar.mjs
 *
 * Pode rodar quantas vezes quiser: a entrada é sempre o original guardado em
 * `originais/`, nunca o arquivo já marcado — senão a segunda execução
 * carimbaria por cima da primeira.
 *
 * Os originais ficam aqui, e não em public/, de propósito: em public/ eles
 * seriam servidos, e a versão sem marca ao lado da com marca anula o motivo de
 * existir a marca.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const MARCA = join(AQUI, 'lotus-brokers.png');

/** Fração da largura da imagem que a marca ocupa, medida nas fotos do dash. */
const LARGURA_RELATIVA = 276 / 1280;

/**
 * Capas a marcar.
 *
 * Só entram arquivos que servem EXCLUSIVAMENTE de capa na vitrine. Avalon,
 * Manawa e Jardins do Horto usam a mesma imagem dentro da própria landing —
 * marcá-la carimbaria o hero delas. Para incluí-las, o caminho é gerar uma
 * cópia marcada (ex.: /avalon/capa.jpg) e apontar lib/developments.ts para ela.
 */
const ALVOS = [
  { original: 'mistral-jundiai.jpg', destino: 'public/mistral-jundiai/capa.jpg' },
  { original: 'epic-jundiai.jpg', destino: 'public/epic-jundiai/capa.jpg' },
];

for (const { original, destino } of ALVOS) {
  const entrada = join(AQUI, 'originais', original);
  const { width, height } = await sharp(entrada).metadata();

  const marca = await sharp(MARCA)
    .resize({ width: Math.round(width * LARGURA_RELATIVA) })
    .toBuffer();
  const m = await sharp(marca).metadata();

  const saida = await sharp(entrada)
    .composite([
      {
        input: marca,
        left: Math.round((width - m.width) / 2),
        top: Math.round((height - m.height) / 2),
      },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  await sharp(saida).toFile(join(RAIZ, destino));
  console.log(`${destino}  ${width}x${height}  marca ${m.width}x${m.height} centrada`);
}
