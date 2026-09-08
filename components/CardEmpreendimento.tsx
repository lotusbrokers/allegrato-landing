import Link from 'next/link';
import { type LancamentoListItem } from '@/lib/lancamentos';

/**
 * O card de empreendimento das páginas de construtora.
 *
 * Mesma forma do card de /lotus-lancamentos — proporção 4/3 na foto, selo
 * "Lotus Listing", bairro com pino, nome em Fraunces, specs, rodapé com preço e
 * chamada — para as duas páginas não parecerem de sites diferentes.
 *
 * Aqui ele é Server Component, e não cliente: a página de construtora é
 * conteúdo estático que o buscador precisa ler no HTML. O efeito de elevar no
 * hover, que na listagem vem do <Hoverable> em JavaScript, vem da classe
 * .lt-card-emp em styles/base.css — mesmo resultado, sem mandar componente
 * para o navegador.
 */
export default function CardEmpreendimento({ item }: { item: LancamentoListItem }) {
  const conteudo = (
    <>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#1d3a2c' }}>
        {item.img && (
          <img
            src={item.img}
            alt={`${item.name}, ${item.neighborhood ? item.neighborhood + ', ' : ''}${item.city}`}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {item.exclusive && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: '#b18a4a',
              color: '#15241c',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              padding: '5px 10px',
              borderRadius: 30,
            }}
          >
            Lotus Listing
          </span>
        )}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8aa593', marginBottom: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8aa593" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {[item.neighborhood, item.city].filter(Boolean).join(' · ')}
        </div>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, fontSize: 23, color: '#15241c', margin: '0 0 6px', lineHeight: 1.05 }}>
          {item.name}
        </h3>
        <div style={{ fontSize: 13.5, color: '#3f6249', marginBottom: 16 }}>{item.specs}</div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            borderTop: '1px solid rgba(21,36,28,.08)',
            paddingTop: 16,
          }}
        >
          <div style={{ fontSize: 14, color: '#15241c', fontWeight: 600 }}>{item.price ?? 'Valor sob consulta'}</div>
          <span style={{ fontSize: 13, color: '#b18a4a', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {item.href ? 'Ver este empreendimento →' : 'Falar com a Lotus →'}
          </span>
        </div>
      </div>
    </>
  );

  const estilo = {
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 16px 40px -32px rgba(21,36,28,.34)',
  };

  // Empreendimento sem landing própria cai no WhatsApp, como na listagem — o
  // visitante não fica com um card que não leva a lugar nenhum.
  if (!item.href) {
    return (
      <a
        className="lt-card-emp"
        href={'https://wa.me/5511926143393?text=' + encodeURIComponent(`Olá! Quero saber mais sobre o ${item.name}.`)}
        target="_blank"
        rel="noopener"
        style={estilo}
      >
        {conteudo}
      </a>
    );
  }

  return (
    <Link className="lt-card-emp" href={item.href} target="_top" style={estilo}>
      {conteudo}
    </Link>
  );
}
