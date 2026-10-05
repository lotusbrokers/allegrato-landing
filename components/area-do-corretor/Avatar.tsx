import estilos from './area.module.css';

/** "Mariana Mamede" → "MM": primeira letra do primeiro e do último nome. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

/**
 * Foto redonda de uma pessoa, ou as iniciais quando não há foto. As fotos da
 * equipe são retratos 4:5; ancorar perto do topo mantém o rosto no círculo.
 */
export default function Avatar({ nome, foto, tamanho = 30 }: { nome: string; foto: string | null; tamanho?: number }) {
  const medida = { width: tamanho, height: tamanho };
  return foto ? (
    <img src={foto} alt="" className={estilos.avatar} width={tamanho} height={tamanho} style={{ ...medida, objectPosition: 'center 15%' }} />
  ) : (
    // 0,43 do tamanho: os 13px que o cabeçalho sempre usou no avatar de 30px.
    <span className={estilos.avatar} style={{ ...medida, fontSize: Math.round(tamanho * 0.43) }} aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}
