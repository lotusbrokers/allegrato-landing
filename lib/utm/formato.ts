/** Data e hora de Brasília, como a equipe lê: "28/10/2026, 14:05". */
const FORMATO = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '—' : FORMATO.format(data);
}

export function plural(n: number, singular: string, pluralForma: string): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? singular : pluralForma}`;
}
