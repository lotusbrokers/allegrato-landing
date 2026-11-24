/**
 * Conversão de foto de landing para WebP, com os mesmos parâmetros para os dois
 * scripts que a usam: scripts/otimizar-fotos-landing.mjs (landings feitas no
 * app) e scripts/otimizar-fotos-landing-html.mjs (landings em HTML de public/).
 *
 * Só para scripts: importa o sharp, que não entra no bundle do site.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const LARGURA_MAX = 2000;
const TAMANHO_MIN = 80 * 1024;

/**
 * WebP de até 2000 px de largura, qualidade 80 (90 para PNG, que costuma ser
 * planta com texto), orientação EXIF aplicada. Sem `webp`, o motivo: foto
 * pequena (até 80 KB) ou WebP que não ficou ao menos 10% menor.
 */
export async function emWebp(arquivo) {
  const bytes = readFileSync(arquivo);
  if (bytes.length < TAMANHO_MIN) return { motivo: 'pequena' };
  const png = /\.png$/i.test(arquivo);
  const webp = await sharp(bytes, { failOn: 'none' })
    .rotate()
    .resize({ width: LARGURA_MAX, withoutEnlargement: true })
    .webp({ quality: png ? 90 : 80 })
    .toBuffer();
  if (webp.length > bytes.length * 0.9) return { motivo: 'WebP não ficou 10% menor' };
  return { webp, antes: bytes.length };
}

/** Nome do arquivo em midia/: hash do conteúdo, para o cache "immutable" (next.config.mjs). */
export function nomeDoWebp(webp) {
  return `${createHash('sha1').update(webp).digest('hex').slice(0, 16)}.webp`;
}
