import { NOTA_NO_GOOGLE, notaComVirgula } from '@/lib/depoimentos';
import { PERFIL_GOOGLE } from '@/lib/site';

/**
 * O "G" do Google, nas cores da marca. Com rótulo, o leitor de tela anuncia;
 * sem rótulo é decorativo, para quando o texto ao lado já diz "Google".
 * Morava dentro de LotusHome; saiu daqui em 13/11/2026, quando a nota passou a
 * aparecer também em /lotus-corretores.
 */
export function LogoGoogle({ tamanho, rotulo }: { tamanho: number; rotulo?: string }) {
  const acessivel = rotulo ? { role: 'img', 'aria-label': rotulo } : { 'aria-hidden': true };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...acessivel}>
      <path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1Z"></path>
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"></path>
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"></path>
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z"></path>
    </svg>
  );
}

/**
 * Nota e total de avaliações da Lotus no Perfil da Empresa no Google, com link
 * para a lista de avaliações. Nota e total são os de lib/depoimentos.ts,
 * conferidos à mão no perfil (sem API). Criado para /lotus-corretores
 * (auditoria do site de 13/11/2026, "Avaliações do Google": não apareciam).
 */
export default function NotaNoGoogle() {
  return (
    <a
      href={PERFIL_GOOGLE.avaliacoes}
      target="_blank"
      rel="noopener"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 18, padding: '12px 20px', textDecoration: 'none', boxShadow: '0 18px 44px -30px rgba(0,0,0,.45)' }}
    >
      <LogoGoogle tamanho={24} />
      <span style={{ display: 'block', textAlign: 'left' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, fontSize: 30, lineHeight: 1, color: '#15241c' }}>{notaComVirgula(NOTA_NO_GOOGLE.nota)}</span>
          <span aria-hidden="true" style={{ color: '#b18a4a', fontSize: 15 }}>★</span>
        </span>
        <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, fontWeight: 600, color: '#3f6249' }}>{NOTA_NO_GOOGLE.total} avaliações no Google · ver todas →</span>
      </span>
    </a>
  );
}
