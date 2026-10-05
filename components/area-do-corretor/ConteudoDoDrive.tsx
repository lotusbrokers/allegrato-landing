import Link from 'next/link';
import type { ItemDoDrive } from '@/lib/area-do-corretor/drive';
import { ROTULO_DO_TIPO, iconeDaPasta } from '@/lib/area-do-corretor/drive-regras';
import AcoesDoArquivo from './AcoesDoArquivo';
import Icone from './Icone';
import estilos from './area.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });

/**
 * O que há numa pasta do Drive: subpastas em cartões e arquivos em linhas.
 * Cada arquivo tem âncora (#arquivo-<id>) para a busca e os favoritos levarem
 * direto a ele.
 */
export default function ConteudoDoDrive({
  itens,
  rotaAtual,
  nomeDaPasta,
  usuario,
}: {
  itens: ItemDoDrive[];
  rotaAtual: string;
  nomeDaPasta: string;
  usuario: string;
}) {
  const pastas = itens.filter((i) => i.pasta);
  const arquivos = itens.filter((i) => !i.pasta);
  if (pastas.length === 0 && arquivos.length === 0) return <p className={estilos.vazio}>Esta pasta está vazia no Drive.</p>;

  return (
    <>
      {pastas.length > 0 && (
        <div className={estilos.gradeAtalhos}>
          {pastas.map((p) => (
            <Link key={p.id} href={`${rotaAtual}/${p.id}`} className={estilos.atalho} style={{ minHeight: 96 }}>
              <span className={estilos.iconeAtalho}>
                <Icone nome={iconeDaPasta(p.nome)} />
              </span>
              <span className={estilos.nomeAtalho}>{p.nome}</span>
            </Link>
          ))}
        </div>
      )}

      {arquivos.length > 0 && (
        <ul className={estilos.listaArquivos}>
          {arquivos.map((a) => (
            <li key={a.id} id={`arquivo-${a.id}`} className={estilos.arquivo}>
              <div className={estilos.arquivoTexto}>
                <span className={estilos.tipoArquivo}>{ROTULO_DO_TIPO[a.tipo]}</span>
                <span className={estilos.nomeArquivo}>{a.nome}</span>
                {a.modificadoEm && (
                  <span className={estilos.dataArquivo}>Atualizado em {DATA.format(new Date(a.modificadoEm))}</span>
                )}
              </div>
              <AcoesDoArquivo
                usuario={usuario}
                link={a.link}
                download={a.download}
                item={{
                  chave: `arquivo:${a.id}`,
                  tipo: 'arquivo',
                  titulo: a.nome,
                  detalhe: nomeDaPasta,
                  href: `${rotaAtual}#arquivo-${a.id}`,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
