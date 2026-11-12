/**
 * Versão montada (pré-render) das landings dc-runtime de public/.
 *
 * O PROBLEMA: Altissimi e Vila Triunfo chegaram como template <x-dc> com
 * {{ expressões }} que o runtime (public/<slug>/midia/<hash>.js, mais o React
 * do unpkg) monta no navegador. Até ele carregar, o visitante via o template
 * cru ("{{ t.label }}") e depois uma tela vazia; robô que lê só o HTML via o
 * código de template no lugar de plantas, ficha técnica e proximidades.
 *
 * A SOLUÇÃO: o arquivo passa a levar a página já montada (gerada por
 * scripts/pre-renderizar-landing.mjs num Chrome headless). O runtime continua
 * igual: o script de arranque devolve o <x-dc> ao documento, o runtime o troca
 * pelo React como sempre, e a versão montada sai quando o React termina.
 *
 *   <head> … [bloco] estilos do <helmet> + regra que esconde o <x-dc> </head>
 *   <template id="dc-template"><x-dc>…</x-dc></template>   ← fora do texto
 *   [bloco] <div id="dc-prerender">página montada</div> + arranque
 *
 * Este módulo só mexe em texto (sem Chrome), para o script e o teste usarem
 * as mesmas regras.
 */
import { createHash } from 'node:crypto';

const INICIO = '<!-- pre-render:inicio -->';
const FIM = '<!-- pre-render:fim -->';
const BLOCO = /<!-- pre-render:inicio -->[\s\S]*?<!-- pre-render:fim -->\n?/g;
const MOLDE_ABRE = '<template id="dc-template"><x-dc>';
const MOLDE_FECHA = '</x-dc></template>';

/** A landing é dc-runtime: tem o template <x-dc> no corpo. */
export function ehLandingDc(html) {
  return /<x-dc[\s>]/.test(html);
}

/** Devolve o HTML como veio do desempacotador, sem nada do pré-render. */
export function semPreRender(html) {
  return html
    .replace(BLOCO, '')
    .replace(MOLDE_ABRE, '<x-dc>')
    .replace(MOLDE_FECHA, '</x-dc>');
}

/** Template (miolo do <x-dc>) e script da página, de onde sai a versão montada. */
export function partesDoTemplate(html) {
  const limpo = semPreRender(html);
  const abre = /<x-dc(?:\s[^>]*)?>/.exec(limpo);
  const fecha = limpo.lastIndexOf('</x-dc>');
  const script = /<script type="text\/x-dc"[\s\S]*?<\/script>/.exec(limpo);
  if (!abre || fecha < abre.index || !script) {
    throw new Error('não achei o <x-dc> e o <script type="text/x-dc"> da landing');
  }
  return { template: limpo.slice(abre.index + abre[0].length, fecha), script: script[0] };
}

/**
 * Impressão digital do template + script. Fica no data-origem da versão
 * montada: se alguém mudar a landing sem gerar de novo, o teste acusa.
 */
export function origemDoTemplate(html) {
  const { template, script } = partesDoTemplate(html);
  return createHash('sha1').update(template).update('\0').update(script).digest('hex').slice(0, 12);
}

/** O data-origem gravado na versão montada, ou null se a página não tem. */
export function origemGravada(html) {
  const m = /<div id="dc-prerender" data-origem="([0-9a-f]+)"/.exec(html);
  return m ? m[1] : null;
}

/**
 * Os <style> do <helmet> do template. O runtime os move para o <head> ao
 * montar; a versão montada precisa deles antes disso (fontes, margem do body,
 * animações do hero).
 */
function estilosDoHelmet(template) {
  const helmet = /<helmet>([\s\S]*?)<\/helmet>/.exec(template);
  if (!helmet) return '';
  return (helmet[1].match(/<style[\s\S]*?<\/style>/g) ?? []).join('\n');
}

// Roda no navegador, logo depois da versão montada. Sem a tag do template
// escrita por extenso: o runtime procura "<x-dc" no texto do arquivo.
const ARRANQUE = `<script>
/* Pré-render (lib/pre-render-landing.mjs). O template volta ao documento,
   escondido, para o runtime montar a página como sempre; quando o React
   termina, a versão montada sai. Se o runtime não carregar, ela fica. */
(function () {
  var molde = document.getElementById('dc-template');
  var pronta = document.getElementById('dc-prerender');
  if (molde) molde.replaceWith(molde.content);
  if (!pronta) return;
  new MutationObserver(function (_, vigia) {
    var raiz = document.getElementById('dc-root');
    if (!raiz || !raiz.firstElementChild) return;
    vigia.disconnect();
    pronta.remove();
  }).observe(document.body, { childList: true, subtree: true });
})();
</script>`;

/**
 * Grava a versão montada no HTML. `montada` é o innerHTML do #dc-root na
 * primeira renderização. Idempotente: refazer troca a versão anterior.
 */
export function comPreRender(html, montada) {
  if (montada.includes('{{')) throw new Error('a versão montada ainda tem {{ }}');
  if (/<\/?x-dc[\s>]/.test(montada)) throw new Error('a versão montada traz a tag do template');
  const limpo = semPreRender(html);
  const { template } = partesDoTemplate(limpo);
  const origem = origemDoTemplate(limpo);

  const cabeca = `${INICIO}\n<style>x-dc{display:none!important}</style>\n${estilosDoHelmet(template)}\n${FIM}\n`;
  const corpo = `\n${INICIO}\n<div id="dc-prerender" data-origem="${origem}">${montada}</div>\n${ARRANQUE}\n${FIM}\n`;

  const abre = /<x-dc(?:\s[^>]*)?>/.exec(limpo);
  const fecha = limpo.lastIndexOf('</x-dc>');
  const antes = limpo.slice(0, abre.index);
  const depois = limpo.slice(fecha + '</x-dc>'.length);
  if (abre[0] !== '<x-dc>') throw new Error(`o <x-dc> tem atributos (${abre[0]}); ajuste MOLDE_ABRE`);

  return (
    antes.replace('</head>', `${cabeca}</head>`) +
    MOLDE_ABRE + template + MOLDE_FECHA + corpo +
    depois.replace(/^\n/, '')
  );
}

/**
 * Texto que um robô sem JavaScript lê como página: tudo fora de <template>,
 * <script> e <style>. É ali que não pode sobrar {{ }}.
 */
export function textoForaDoTemplate(html) {
  return html
    .replace(/<template[\s\S]*?<\/template>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
}
