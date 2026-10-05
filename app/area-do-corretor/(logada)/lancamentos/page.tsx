import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoLancamento } from '@/components/area-do-corretor/Cartoes';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo } from '@/lib/area-do-corretor/dados';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Lançamentos' };

const ROTA = `${ROTA_BASE}/lancamentos`;

export default async function LancamentosDaArea({ searchParams }: { searchParams: Promise<{ fase?: string }> }) {
  await exigirCorretor();
  const { fase } = await searchParams;
  const { lancamentos } = await catalogo();

  // As fases são as que existem no cadastro (o texto vem da Dashboard), na ordem em que aparecem.
  const fases = [...new Set(lancamentos.map((l) => l.stage).filter(Boolean))];
  const filtrados = fase ? lancamentos.filter((l) => l.stage === fase) : lancamentos;
  // Exclusivos da Lotus na frente; o resto na ordem do cadastro.
  const ordenados = [...filtrados].sort((a, b) => Number(b.exclusive) - Number(a.exclusive));

  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Lançamentos</h1>
        <p className={estilos.subtitulo}>
          {lancamentos.length} empreendimentos que a Lotus comercializa. Cada um tem a ficha, o link da página pública
          para mandar ao cliente e os materiais da pasta dele no Drive.
        </p>
      </div>

      {fases.length > 1 && (
        <nav className={estilos.chips} aria-label="Filtrar por fase da obra">
          <Link href={ROTA} className={`${estilos.chip} ${!fase ? estilos.chipAtivo : ''}`} aria-current={!fase ? 'page' : undefined}>
            Todos
          </Link>
          {fases.map((f) => (
            <Link
              key={f}
              href={`${ROTA}?fase=${encodeURIComponent(f)}`}
              className={`${estilos.chip} ${fase === f ? estilos.chipAtivo : ''}`}
              aria-current={fase === f ? 'page' : undefined}
            >
              {f}
            </Link>
          ))}
        </nav>
      )}

      {ordenados.length > 0 ? (
        <div className={estilos.grade}>
          {ordenados.map((l) => (
            <CartaoLancamento key={l.id} l={l} />
          ))}
        </div>
      ) : (
        <p className={estilos.vazio}>Nenhum lançamento nesta fase.</p>
      )}
    </>
  );
}
