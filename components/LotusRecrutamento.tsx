'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PERGUNTAS_RECRUTAMENTO, linkDoWhatsApp, mensagemDeCandidatura } from '@/lib/recrutamento';
import { SITE, footerLegalLine } from '@/lib/site';

/**
 * Página "Seja um corretor Lotus" (/lotus-recrutamento).
 *
 * Fonte: Seja-Corretor-Lotus.html, enviado pela Lotus em 19/10/2026 para
 * substituir a versão anterior. Essa versão era um porte do estático antigo,
 * tinha depoimentos de exemplo e um formulário que só mostrava "Recebido": a
 * candidatura não chegava a ninguém. Textos e visual são os do arquivo; o CSS
 * está em app/lotus-recrutamento/recrutamento.css.
 *
 * Ajustes em relação ao arquivo:
 *  - o e-mail entra na mensagem do WhatsApp (o formulário pedia e descartava);
 *  - o telefone do rodapé já sai no HTML (o arquivo mostrava
 *    "[INSERIR TELEFONE]" até o script rodar);
 *  - "Política de Privacidade" virou link, e o rodapé ganhou a linha de CRECI e
 *    CNPJ do site e os links das políticas;
 *  - 79 condomínios, e não 44: é o que o índice /lotus-condominio mostrava em
 *    19/10/2026;
 *  - o efeito de entrada só esconde o que está abaixo da dobra (ver o useEffect).
 * Medição, aviso de cookies e robots vêm do layout do portal, como nas demais
 * páginas.
 */

const VANTAGENS = [
  { icone: '💰', titulo: 'Comissão até 60%', texto: 'Tabela transparente, sem letra miúda. Você sabe exatamente quanto ganha em cada negócio — e ganha de verdade.' },
  { icone: '🎓', titulo: 'Formação de especialista', texto: 'Treinamento completo e mentoria 1:1 de quem já formou os melhores corretores da região. Com ou sem experiência.' },
  { icone: '⚙️', titulo: 'Estrutura que vende por você', texto: 'Marketing, CRM, fotos, material e tecnologia prontos. Você foca no cliente; o braçal fica com a casa.' },
  { icone: '📍', titulo: 'Um bairro para chamar de seu', texto: 'Em vez de brigar por lead, você vira a autoridade de uma região — com conteúdo e carteira para sustentar isso.' },
  { icone: '🤝', titulo: 'Cultura e time', texto: 'Ambiente de gente que se ajuda, com método e metas claras. Aqui ninguém cresce sozinho.' },
  { icone: '📈', titulo: 'Plano de carreira', texto: 'Trilha de evolução real: do início ao especialista sênior, com reconhecimento por resultado.' },
];

const PASSOS = [
  { numero: '01', titulo: 'Candidatura', texto: 'Você preenche o formulário abaixo em 2 minutos. Com ou sem experiência.' },
  { numero: '02', titulo: 'Conversa', texto: 'Um bate-papo para a gente se conhecer e entender seu momento e seus objetivos.' },
  { numero: '03', titulo: 'Imersão & treinamento', texto: 'Formação completa: produto, bairro, processo e as ferramentas da Lotus.' },
  { numero: '04', titulo: 'Primeira venda com mentoria', texto: 'Você entra em campo acompanhado, com a estrutura toda a seu favor.' },
];

const CULTURA = [
  'Mentoria de verdade, não "vira o jogo sozinho"',
  'Estrutura de marketing e tecnologia que trabalha por você',
  'Comissão transparente e plano de carreira',
  'Um bairro e uma carteira para chamar de seus',
];

const EXPERIENCIAS = ['Tenho experiência', 'Estou começando / sem experiência', 'Tenho CRECI', 'Quero tirar o CRECI'];
const AREAS = ['Corretor de imóveis', 'Administrativo', 'Financeiro', 'Marketing'];

const WHATSAPP_DIRETO = linkDoWhatsApp('Olá! Tenho interesse na carreira de corretor na Lotus.');

export default function LotusRecrutamento() {
  const raiz = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const fecharMenu = () => setMenuAberto(false);

  /**
   * Efeito de entrada dos blocos [data-reveal]. No arquivo, todos começavam
   * invisíveis no CSS e só apareciam pelo script: sem JavaScript a página
   * ficava em branco, e o título do topo esperava o script para existir na
   * tela (é o maior elemento, o que mede o LCP). Aqui o que já está na tela
   * recebe .in antes de .revelar ligar o efeito, e só o que está abaixo da
   * dobra anima ao entrar na tela.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const blocos = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    for (const bloco of blocos) {
      if (bloco.getBoundingClientRect().top < window.innerHeight) bloco.classList.add('in');
    }
    el.classList.add('revelar');
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add('in');
          observador.unobserve(entrada.target);
        }
      },
      { threshold: 0.14 },
    );
    for (const bloco of blocos) if (!bloco.classList.contains('in')) observador.observe(bloco);
    return () => observador.disconnect();
  }, []);

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const campo = (nome: string) => String(dados.get(nome) ?? '');
    const mensagem = mensagemDeCandidatura({
      nome: campo('nome'),
      whatsapp: campo('whatsapp'),
      email: campo('email'),
      experiencia: campo('experiencia'),
      area: campo('area'),
    });
    const link = linkDoWhatsApp(mensagem);
    // Sem o terceiro argumento ("noopener"): com ele, o navegador pode abrir
    // uma janela de popup em vez de uma aba. O opener é cortado logo depois.
    const aba = window.open(link, '_blank');
    if (aba) aba.opener = null;
    // Aba bloqueada: abre o WhatsApp nesta mesma, senão a candidatura se perde
    // e a tela ainda diria "Abrimos o seu WhatsApp".
    else window.location.href = link;
    setEnviado(true);
  };

  return (
    <div className="recru" ref={raiz}>
      <header>
        <nav className="wrap">
          <a href="#topo" className="logo">
            Lotus<small>Brokers</small>
          </a>
          <div className={menuAberto ? 'navlinks open' : 'navlinks'} id="recru-menu">
            <a href="#ganha" onClick={fecharMenu}>O que você ganha</a>
            <a href="#como" onClick={fecharMenu}>Como funciona</a>
            <a href="#faq" onClick={fecharMenu}>Dúvidas</a>
            <a href="#candidatar" className="btn btn-gold" onClick={fecharMenu}>Quero ser corretor</a>
          </div>
          <button
            type="button"
            className="burger"
            aria-label="Menu"
            aria-expanded={menuAberto}
            aria-controls="recru-menu"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            ☰
          </button>
        </nav>
      </header>

      <section className="hero" id="topo">
        <div className="wrap">
          <div className="hero-inner" data-reveal="">
            <p className="eyebrow">Carreira na Lotus · Jundiaí e Itupeva</p>
            <h1>
              Pare de ser mais um. Vire o <em>especialista</em> do seu bairro.
            </h1>
            <p className="hero-sub">
              Mentoria de quem formou os melhores corretores da região, estrutura que te tira do operacional e
              comissão de verdade — até 60%. Com ou sem experiência, a gente te forma do zero ao topo.
            </p>
            <div className="hero-cta">
              <a href="#candidatar" className="btn btn-gold">Quero ser corretor</a>
              <a href="#ganha" className="btn btn-ghost">Ver o que você ganha</a>
            </div>
            <p className="hero-mini">Vagas também para administrativo, financeiro e marketing.</p>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="wrap">
          <div className="stat"><b>60%</b><span>Comissão até</span></div>
          <div className="stat"><b>1:1</b><span>Mentoria e formação</span></div>
          <div className="stat"><b>79</b><span>Condomínios mapeados</span></div>
          <div className="stat"><b>2 cidades</b><span>Jundiaí + Itupeva</span></div>
        </div>
      </section>

      <section className="dor">
        <div className="wrap" data-reveal="">
          <p className="eyebrow" style={{ color: 'var(--gold-2)' }}>O mercado comum</p>
          <h2>Tudo o que falta na imobiliária comum.</h2>
          <p>
            Você foi treinado para disputar lead em grupo de WhatsApp, vender qualquer coisa em qualquer lugar e
            correr atrás de portal. Sem estrutura, sem formação de verdade, preso ao operacional que devora o seu
            dia. Você merece mais do que isso.
          </p>
          <p className="punch">Vendedor de imóveis é commodity. Especialista é escolha.</p>
        </div>
      </section>

      <section className="ganha" id="ganha">
        <div className="wrap">
          <div data-reveal="" style={{ maxWidth: '60ch' }}>
            <p className="eyebrow">O que você ganha</p>
            <h2>Estrutura de especialista, não de vendedor solto.</h2>
          </div>
          <div className="cards">
            {VANTAGENS.map((v) => (
              <div className="card" data-reveal="" key={v.titulo}>
                <div className="ic" aria-hidden="true">{v.icone}</div>
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="como" id="como">
        <div className="wrap">
          <div data-reveal="" style={{ maxWidth: '60ch' }}>
            <p className="eyebrow">Como funciona</p>
            <h2>Tem método, não improviso.</h2>
            <p className="lead">Do primeiro contato à primeira venda, você é acompanhado em cada passo.</p>
          </div>
          <div className="steps">
            {PASSOS.map((p) => (
              <div className="step" data-reveal="" key={p.numero}>
                <b>{p.numero}</b>
                <h4>{p.titulo}</h4>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cultura">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div data-reveal="">
            <p className="eyebrow" style={{ color: 'var(--gold-2)' }}>A cultura Lotus</p>
            <h2>Seu próximo capítulo começa aqui.</h2>
            <p className="lead">
              A Lotus foi feita para quem quer parar de ser mais um e construir reputação de especialista. Aqui você
              encontra:
            </p>
            <ul>
              {CULTURA.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="contato" id="candidatar">
        <div className="wrap contato-grid">
          <div data-reveal="">
            <p className="eyebrow">Candidate-se</p>
            <h2>Conta pra gente quem você é.</h2>
            <p className="lead">
              Preencha e um recrutador da Lotus entra em contato. Leva 2 minutos — e pode ser o início do seu
              próximo capítulo.
            </p>
            <ul className="benef">
              <li>Com ou sem experiência</li>
              <li>Formação completa inclusa</li>
              <li>Resposta rápida pelo WhatsApp</li>
            </ul>
          </div>
          <div data-reveal="">
            <div className="form-card">
              {enviado ? (
                <div className="ok-msg show" role="status">
                  <p className="big">✓ Recebido!</p>
                  <p className="sm">
                    Abrimos o seu WhatsApp com a mensagem pronta — é só enviar. Nosso time de recrutamento responde
                    em instantes.
                  </p>
                </div>
              ) : (
                <div>
                  <h3>Quero ser corretor Lotus</h3>
                  <p className="sm">Também há vagas para administrativo, financeiro e marketing.</p>
                  <form onSubmit={enviar}>
                    <div className="field">
                      <label htmlFor="recru-nome">Nome completo</label>
                      <input type="text" id="recru-nome" name="nome" placeholder="Seu nome" autoComplete="name" required />
                    </div>
                    <div className="field">
                      <label htmlFor="recru-whatsapp">WhatsApp com DDD</label>
                      <input type="tel" id="recru-whatsapp" name="whatsapp" placeholder="(11) 90000-0000" autoComplete="tel" required />
                    </div>
                    <div className="field">
                      <label htmlFor="recru-email">E-mail</label>
                      <input type="email" id="recru-email" name="email" placeholder="voce@email.com" autoComplete="email" />
                    </div>
                    <div className="field">
                      <label htmlFor="recru-experiencia">Experiência como corretor</label>
                      <select id="recru-experiencia" name="experiencia">
                        {EXPERIENCIAS.map((op) => (
                          <option key={op}>{op}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="recru-area">Área de interesse</label>
                      <select id="recru-area" name="area">
                        {AREAS.map((op) => (
                          <option key={op}>{op}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-gold">Enviar candidatura →</button>
                    <p className="consent">
                      Ao enviar, você concorda em ser contatado pela Lotus Brokers sobre a vaga, inclusive por
                      WhatsApp, conforme a <Link href="/lotus-privacidade">Política de Privacidade</Link>.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="wrap">
          <div data-reveal="" style={{ maxWidth: '60ch' }}>
            <p className="eyebrow">Dúvidas</p>
            <h2>Como ser corretor em Jundiaí?</h2>
          </div>
          <div style={{ marginTop: 34 }}>
            {PERGUNTAS_RECRUTAMENTO.map((f) => (
              <div className="faq-item" data-reveal="" key={f.pergunta}>
                <h4>{f.pergunta}</h4>
                <p>{f.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* data-rodape-portal: styles/base.css reserva a faixa do botão flutuante
          do WhatsApp, que cobria a coluna da direita no fim da página. */}
      <footer data-rodape-portal="">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-logo">
              Lotus Brokers<small>Jundiaí · Itupeva</small>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#fff', fontWeight: 600 }}>Carreira na Lotus</p>
              <p>WhatsApp: {SITE.telefone}</p>
              <p>
                <Link href="/" style={{ color: 'var(--gold-2)' }}>lotusbrokers.com.br</Link>
              </p>
            </div>
          </div>
          <p className="legal">
            Lotus Brokers — imobiliária em Jundiaí e Itupeva. As condições de comissão, carreira e treinamento são
            apresentadas em detalhe no processo seletivo. Ao se candidatar, você concorda com o tratamento dos seus
            dados para fins de recrutamento, conforme a Lei nº 13.709 (LGPD).
          </p>
          <p className="legal" style={{ marginTop: 10 }}>
            {footerLegalLine()} · <Link href="/lotus-privacidade">Privacidade</Link> ·{' '}
            <Link href="/lotus-termos">Termos de uso</Link> · <Link href="/lotus-cookies">Cookies</Link>
          </p>
        </div>
      </footer>

      {/* data-flutuantes: sobe acima do aviso de cookies enquanto ele está na tela
          e respeita a barra de gestos do iPhone (styles/base.css). */}
      <a className="wa-float" data-flutuantes="" href={WHATSAPP_DIRETO} target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.489-.917zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.017-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        Falar no WhatsApp
      </a>
    </div>
  );
}
