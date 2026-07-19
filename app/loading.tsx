// Loading UI global (App Router). O Next mostra isto instantaneamente durante a
// navegação enquanto o conteúdo da próxima rota é preparado — elimina a tela
// branca em transições para rotas que precisem buscar/revalidar (home,
// lançamentos). Para as SSG puras a transição é imediata e isto quase não
// aparece. Discreto, na paleta do site, sem depender de client JS.
export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f2e8',
        zIndex: 9998,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid rgba(21,36,28,.15)',
          borderTopColor: '#b18a4a',
          animation: 'lotus-spin .7s linear infinite',
        }}
      />
      <style>{`@keyframes lotus-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
