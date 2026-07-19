import type { Metadata } from 'next';

// Metadata portado do <head> do fonte estatico (lotus-privacidade/index.html).
export const metadata: Metadata = {
  title: 'Política de Privacidade (LGPD) | Lotus Brokers',
  description:
    'Política de Privacidade da Lotus Brokers, conforme a LGPD: quais dados coletamos, por quê e seus direitos.',
  alternates: {
    canonical: 'https://www.lotusbrokers.com.br/lotus-privacidade',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/lotus-privacidade',
    title: 'Política de Privacidade (LGPD) — Lotus Brokers',
    description:
      'Política de Privacidade da Lotus Brokers, conforme a LGPD: quais dados coletamos, por quê e seus direitos.',
    images: [
      'https://i.postimg.cc/nzx1wvHM/Chat-GPT-Image-25-de-jun-de-2026-14-04-13.png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

// CSS EXATO do <style> do fonte. Mantido literal (scopeado no componente via seletores originais).
const css = `
:root{--ink:#15241c;--cream:#f7f2e8;--gold:#cdab6e;--bronze:#b18a4a;--moss:#3f6249;}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--cream);color:var(--ink);line-height:1.6}
header{position:sticky;top:0;z-index:60;background:var(--ink)}
.bar{max-width:900px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.logo span{font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:21px;color:var(--cream)}
.logo span i{font-size:10px;letter-spacing:.18em;color:var(--gold);font-style:normal;display:block;margin-top:2px}
.back{color:rgba(247,242,232,.85);text-decoration:none;font-size:14px;font-weight:500}
.back:hover{color:var(--gold)}
main{max-width:760px;margin:0 auto;padding:54px 24px 80px}
h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(28px,5vw,40px);line-height:1.1;margin:0 0 8px}
.upd{color:var(--moss);font-size:13.5px;margin:0 0 36px}
h2{font-family:Georgia,serif;font-weight:500;font-size:21px;margin:34px 0 10px}
p,li{font-size:15.5px;color:#27382f}
a{color:var(--bronze)}
.note{background:#fffaf0;border:1px solid var(--gold);border-radius:12px;padding:14px 18px;font-size:13.5px;color:var(--moss);margin:30px 0}
footer{background:var(--ink);color:rgba(247,242,232,.7);font-size:13px}
.fbar{max-width:900px;margin:0 auto;padding:30px 24px;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between}
footer a{color:rgba(247,242,232,.7);text-decoration:none}footer a:hover{color:var(--gold)}
`;

// Script de consentimento de cookies EXATO do fonte (roda no browser; nao requer 'use client').
const cookieScript = `(function(){try{var b=document.getElementById("lotus-cookie");if(!b)return;if(document.cookie.indexOf("lotus_consent=")===-1){b.style.display="block";}function s(v){document.cookie="lotus_consent="+v+";path=/;max-age=15552000;SameSite=Lax";b.style.display="none";window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:"cookie_consent",consent:v});}document.getElementById("lotus-cookie-accept").addEventListener("click",function(){s("all")});document.getElementById("lotus-cookie-reject").addEventListener("click",function(){s("essential")});}catch(e){}})();`;

export default function LotusPrivacidadePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header>
        <div className="bar">
          <a className="logo" href="../lotus-home/">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 2.5C20.5 9 20.5 16 16 22.5 11.5 16 11.5 9 16 2.5Z" fill="#cdab6e" />
            </svg>
            <span>
              Lotus<i>BROKERS</i>
            </span>
          </a>
          <a className="back" href="../lotus-home/">
            ← Voltar ao site
          </a>
        </div>
      </header>
      <main>
        <h1>Política de Privacidade</h1>
        <p className="upd">Última atualização: 30 de junho de 2026</p>
        <div className="note">
          📋 Conteúdo-base padrão para imobiliária com LGPD.{' '}
          <strong>Recomenda-se revisão jurídica</strong> antes da divulgação pública (go-live),
          incluindo a inserção da razão social, CNPJ, CRECI-PJ e endereço completos da Lotus
          Brokers.
        </div>
        <p>
          A Lotus Brokers ("Lotus", "nós") respeita a sua privacidade e trata seus dados pessoais
          conforme a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD). Esta política
          explica quais dados coletamos, por que, e quais são os seus direitos.
        </p>
        <h2>1. Dados que coletamos</h2>
        <p>
          Coletamos os dados que você nos fornece ao preencher formulários (nome, e-mail,
          telefone/WhatsApp e a mensagem sobre o imóvel ou serviço de interesse), além de dados de
          navegação coletados por cookies (ver Política de Cookies).
        </p>
        <h2>2. Por que tratamos seus dados</h2>
        <p>
          Para responder ao seu contato, conectar você ao especialista do seu bairro, enviar
          informações de imóveis e lançamentos que você solicitou e, com o seu consentimento,
          comunicações de marketing. A base legal é o seu consentimento e a execução de medidas
          pré-contratuais a seu pedido.
        </p>
        <h2>3. Compartilhamento</h2>
        <p>
          Seus dados podem ser compartilhados com corretores parceiros da Lotus e com provedores de
          tecnologia (ex.: ferramentas de atendimento e analytics) estritamente para as finalidades
          acima. Não vendemos seus dados.
        </p>
        <h2>4. Seus direitos</h2>
        <p>
          Você pode, a qualquer momento, confirmar o tratamento, acessar, corrigir, eliminar, portar
          seus dados e revogar o consentimento, conforme o art. 18 da LGPD. Para exercer seus
          direitos, fale conosco pelo WhatsApp{' '}
          <a href="https://wa.me/5511926143393" target="_blank" rel="noopener">
            +55 11 92614-3393
          </a>
          .
        </p>
        <h2>5. Retenção e segurança</h2>
        <p>
          Mantemos os dados pelo tempo necessário às finalidades informadas ou conforme exigido por
          lei, adotando medidas de segurança razoáveis para protegê-los.
        </p>
        <p style={{ marginTop: '40px' }}>
          <a href="../lotus-home/">← Voltar para a Lotus Brokers</a>
        </p>
      </main>
      <footer>
        <div className="fbar">
          <div>© 2026 Lotus Brokers · CRECI PJ 00000-J · CNPJ 00.000.000/0001-00</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="../lotus-privacidade/">Privacidade</a>
            <a href="../lotus-termos/">Termos</a>
            <a href="../lotus-cookies/">Cookies</a>
          </div>
        </div>
      </footer>
      <div
        id="lotus-cookie"
        role="dialog"
        aria-label="Aviso de cookies"
        style={{
          position: 'fixed',
          left: '16px',
          right: '16px',
          bottom: '16px',
          zIndex: 9999,
          maxWidth: '560px',
          margin: '0 auto',
          background: '#15241c',
          color: '#f7f2e8',
          border: '1px solid rgba(205,171,110,.4)',
          borderRadius: '14px',
          padding: '18px 20px',
          boxShadow: '0 18px 50px -20px rgba(0,0,0,.5)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          display: 'none',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: '13.5px',
            lineHeight: 1.5,
            color: 'rgba(247,242,232,.85)',
          }}
        >
          Usamos cookies para melhorar sua experiência e entender o uso do site. Aceite todos ou
          recuse os não-essenciais.{' '}
          <a href="../lotus-cookies/" style={{ color: '#cdab6e', textDecoration: 'underline' }}>
            Política de Cookies
          </a>
          .
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            id="lotus-cookie-accept"
            type="button"
            style={{
              background: '#b18a4a',
              color: '#15241c',
              fontWeight: 700,
              fontSize: '13.5px',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '30px',
              cursor: 'pointer',
            }}
          >
            Aceitar todos
          </button>
          <button
            id="lotus-cookie-reject"
            type="button"
            style={{
              background: 'transparent',
              color: '#f7f2e8',
              fontWeight: 600,
              fontSize: '13.5px',
              border: '1px solid rgba(247,242,232,.3)',
              padding: '10px 18px',
              borderRadius: '30px',
              cursor: 'pointer',
            }}
          >
            Recusar não-essenciais
          </button>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: cookieScript }} />
    </>
  );
}
