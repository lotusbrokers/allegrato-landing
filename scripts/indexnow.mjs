/**
 * Avisa pelo IndexNow que páginas do portal mudaram, para os buscadores que
 * participam (Bing, Yandex, Seznam, Naver, Yep) passarem nelas antes da
 * próxima visita de rotina. Avisar não garante indexação: o buscador decide.
 *
 * O Google NÃO participa do IndexNow. Para ele o caminho continua sendo o
 * sitemap enviado no Search Console e a inspeção de URL.
 *
 * Por padrão só LISTA o que mandaria. Envia de verdade com --enviar, e
 * sempre DEPOIS do deploy: o arquivo da chave precisa estar no ar, e avisar
 * antes faria o robô ler a versão velha da página.
 *
 *   node scripts/indexnow.mjs                          # todas as URLs do sitemap
 *   node scripts/indexnow.mjs --desde 2026-11-16       # só as com lastmod a partir do dia
 *   node scripts/indexnow.mjs gioviale lotus-blog/x    # só estas (ou a URL inteira)
 *   node scripts/indexnow.mjs --desde 2026-11-16 --enviar
 *
 * Com lista de caminhos, o --desde não vale: vão só os da lista.
 *
 * Mandar todas é para a primeira vez. Depois, só o que mudou (--desde ou a
 * lista): reenviar páginas iguais não adianta e gasta a cota.
 *
 * A chave é pública por desenho do protocolo: o arquivo public/<CHAVE>.txt,
 * servido na raiz do site, prova que quem avisa controla o domínio. Trocar a
 * chave é trocar a constante e renomear o arquivo no mesmo commit.
 */
import { readFileSync } from 'node:fs';

const SITE = 'https://www.lotusbrokers.com.br';
const CHAVE = '957850290d08780a19bcbca20f22ee04';
const LOCAL_DA_CHAVE = `${SITE}/${CHAVE}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const LIMITE_DO_PROTOCOLO = 10_000; // URLs por envio

const SIGNIFICADO = {
  200: 'recebido',
  202: 'recebido; a chave ainda vai ser conferida',
  400: 'pedido mal formado',
  // Na primeira vez o serviço ainda está conferindo a chave e responde 403
  // "SiteVerificationNotCompleted" (16/11/2026): é só tentar de novo depois.
  403: 'chave não aceita: ainda em verificação (tentar de novo em alguns minutos) ou diferente do arquivo no ar',
  422: 'URL fora do domínio ou chave que não bate',
  429: 'avisos demais; esperar antes de mandar de novo',
};

function lerArgumentos(argv) {
  const iDesde = argv.indexOf('--desde');
  const desde = iDesde >= 0 ? argv[iDesde + 1] : null;
  if (iDesde >= 0 && !/^\d{4}-\d{2}-\d{2}$/.test(desde ?? '')) {
    throw new Error('--desde pede uma data no formato AAAA-MM-DD');
  }
  const dataDoDesde = iDesde >= 0 ? iDesde + 1 : -1;
  const caminhos = argv.filter((a, i) => !a.startsWith('--') && i !== dataDoDesde);
  return { enviar: argv.includes('--enviar'), desde, caminhos };
}

/**
 * "gioviale", "/gioviale" ou a URL inteira; recusa endereço de outro domínio.
 * O Git Bash do Windows troca "/gioviale" por "C:/Program Files/Git/gioviale"
 * antes de o script ver: daí a dica no erro.
 */
function paraUrl(caminho) {
  const url = new URL(caminho, SITE);
  if (url.origin !== SITE) {
    throw new Error(`${caminho} não é de ${SITE} (no Git Bash, escreva o caminho sem a barra inicial)`);
  }
  return url.href;
}

async function urlsDoSitemap(desde) {
  const resposta = await fetch(`${SITE}/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } });
  if (!resposta.ok) throw new Error(`sitemap respondeu ${resposta.status}`);
  const xml = await resposta.text();
  const entradas = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, bloco]) => ({
    loc: (bloco.match(/<loc>([^<]+)<\/loc>/) || [])[1]?.trim(),
    lastmod: (bloco.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1]?.trim(),
  }));
  // Meia-noite em São Paulo (sem horário de verão desde 2019).
  const corte = desde ? new Date(`${desde}T00:00:00-03:00`) : null;
  return entradas
    .filter((e) => e.loc && (!corte || (e.lastmod && new Date(e.lastmod) >= corte)))
    .map((e) => paraUrl(e.loc));
}

function conferirChaveNoRepositorio() {
  const arquivo = new URL(`../public/${CHAVE}.txt`, import.meta.url);
  if (readFileSync(arquivo, 'utf8').trim() !== CHAVE) {
    throw new Error(`public/${CHAVE}.txt não contém a chave`);
  }
}

async function conferirChaveNoAr() {
  const resposta = await fetch(LOCAL_DA_CHAVE, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
  const texto = resposta.ok ? (await resposta.text()).trim() : '';
  if (texto !== CHAVE) {
    throw new Error(`${LOCAL_DA_CHAVE} respondeu ${resposta.status} sem a chave. O deploy com o arquivo já foi?`);
  }
}

async function avisar(urls) {
  const host = new URL(SITE).host;
  for (let i = 0; i < urls.length; i += LIMITE_DO_PROTOCOLO) {
    const lote = urls.slice(i, i + LIMITE_DO_PROTOCOLO);
    const resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: CHAVE, keyLocation: LOCAL_DA_CHAVE, urlList: lote }),
    });
    console.log(`${lote.length} URL(s): HTTP ${resposta.status}, ${SIGNIFICADO[resposta.status] ?? 'resposta inesperada'}`);
    if (!resposta.ok) {
      console.log(await resposta.text());
      process.exitCode = 1;
      return;
    }
  }
}

const { enviar, desde, caminhos } = lerArgumentos(process.argv.slice(2));
conferirChaveNoRepositorio();
const urls = caminhos.length ? caminhos.map(paraUrl) : await urlsDoSitemap(desde);

if (!urls.length) {
  console.log('Nenhuma URL para avisar.');
} else {
  console.log(urls.join('\n'));
  console.log(`\n${urls.length} URL(s).`);
  if (!enviar) {
    console.log('Nada foi enviado. Para enviar, depois do deploy, acrescente --enviar.');
  } else {
    await conferirChaveNoAr();
    await avisar(urls);
  }
}
