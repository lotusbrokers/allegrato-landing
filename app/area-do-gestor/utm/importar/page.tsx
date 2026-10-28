import type { Metadata } from 'next';
import Importador from '@/components/utm/Importador';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { DEFINICAO_DOS_CAMPOS } from '@/lib/utm/colunas';
import { ROTA_UTM } from '@/lib/utm/painel';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Importar CSV' };

export default async function ImportarCsv() {
  await exigirGestor();
  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Importar CSV do Meta Ads</h1>
        <p>
          Nesta primeira versão, entram só registros ativos: ligados na campanha, no conjunto e no anúncio. O que estiver pausado,
          arquivado ou sem informação suficiente aparece na prévia com o motivo e fica de fora.
        </p>
      </header>

      <details className={estilos.painel}>
        <summary>Como exportar do Gerenciador de Anúncios</summary>
        <ol className={estilos.lista}>
          <li>No Gerenciador de Anúncios, filtre a entrega por campanhas ativas e abra a aba Anúncios.</li>
          <li>
            Em Exportar, escolha "Exportar dados da tabela" em CSV ou, para trazer status, URL e parâmetros de todos os níveis, o
            formato de edição em massa.
          </li>
          <li>Não abra o arquivo no Excel antes de importar: ele transforma os IDs da Meta em notação científica e corta dígitos.</li>
        </ol>
        <h3>Colunas que a ferramenta entende</h3>
        <ul className={estilos.lista}>
          {Object.values(DEFINICAO_DOS_CAMPOS).map((d) => (
            <li key={d.rotulo}>{d.rotulo}</li>
          ))}
        </ul>
        <p>Obrigatórias: ID da campanha e nome da campanha. Com o ID do anúncio, cada anúncio vira um registro próprio.</p>
      </details>

      <Importador base={ROTA_UTM} />
    </>
  );
}
