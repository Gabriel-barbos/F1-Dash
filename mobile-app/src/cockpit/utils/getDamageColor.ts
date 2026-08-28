/**
 * getDamageColor — Utilitário de cor por nível de dano
 *
 * Função pura extraída de DamageHeatmap e CarDamageMomentaryOverlay
 * onde estava duplicada. Centraliza a lógica de cor de dano.
 */

export function getDamageColor(percent: number): string {
  const val = Math.max(0, Number(percent) || 0);
  if (val <= 0) return '#22c55e';   // Sem dano — Verde
  if (val < 25) return '#eab308';  // Leve — Amarelo
  if (val < 50) return '#f97316';  // Moderado — Laranja
  return '#ef4444';                 // Severo — Vermelho
}

/**
 * Retorna uma cor de desgaste de pneu baseada no percentual.
 * Escala invertida: 100% desgaste = ruim.
 */
export function getTyreWearColor(wearPercent: number): string {
  const val = Math.max(0, Math.min(100, Number(wearPercent) || 0));
  if (val < 20) return '#22c55e';
  if (val < 40) return '#84cc16';
  if (val < 60) return '#eab308';
  if (val < 80) return '#f97316';
  return '#ef4444';
}
