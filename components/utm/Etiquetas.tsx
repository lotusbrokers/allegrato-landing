import { ROTULO_DA_SEVERIDADE, ROTULO_DO_RASTREAMENTO, type Rastreamento } from '@/lib/utm/auditoria';
import type { EstadoDaAplicacao, Severidade } from '@/lib/utm/tipos';
import estilos from './utm.module.css';

const COR_DO_RASTREAMENTO: Record<Rastreamento, string> = {
  valido: estilos.valido,
  atencao: estilos.atencao,
  critico: estilos.critico,
  ausente: estilos.neutro,
};

export function EtiquetaDoRastreamento({ rastreamento }: { rastreamento: Rastreamento }) {
  return <span className={`${estilos.etiqueta} ${COR_DO_RASTREAMENTO[rastreamento]}`}>{ROTULO_DO_RASTREAMENTO[rastreamento]}</span>;
}

export function EtiquetaDaSeveridade({ severidade }: { severidade: Severidade }) {
  return <span className={`${estilos.etiqueta} ${estilos[severidade]}`}>{ROTULO_DA_SEVERIDADE[severidade]}</span>;
}

export const ROTULO_DA_ETAPA: Record<EstadoDaAplicacao | 'ausente', string> = {
  ausente: 'UTM não gerada',
  gerada: 'UTM gerada',
  copiada: 'Parâmetros copiados',
  confirmada: 'Aplicação confirmada manualmente',
  validada: 'Validada por nova importação',
};

export function EtiquetaDaEtapa({ etapa }: { etapa: EstadoDaAplicacao | undefined }) {
  const cor = etapa === 'validada' ? estilos.valido : etapa === 'confirmada' ? estilos.informativo : estilos.neutro;
  return <span className={`${estilos.etiqueta} ${cor}`}>{ROTULO_DA_ETAPA[etapa ?? 'ausente']}</span>;
}
