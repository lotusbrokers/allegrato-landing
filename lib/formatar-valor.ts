/**
 * Valor em reais para a UI.
 *
 * Módulo próprio, sem o client do Supabase, para componente 'use client'
 * importar sem levar o banco para o navegador. Morando em lib/imoveis, que cria
 * o client no topo do módulo, o formatValor arrastava o Supabase inteiro para o
 * bundle de quem o importava. Importando daqui, o First Load JS da página do
 * imóvel caiu de 198 kB para 136 kB (28/10/2026).
 *
 * lib/imoveis reexporta a função, então quem já importa de lá segue igual. Em
 * componente 'use client', importar daqui.
 */

// Formata valor em R$ (para a UI). null/0 -> "Consultar valor".
export function formatValor(v: number | null): string {
  if (!v || v <= 0) return 'Consultar valor';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
