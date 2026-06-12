/* Allegrato — Tweaks island. Drives CSS vars + hero on the plain-HTML page. */
const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSelect } = window;

const ACCENTS = {
  'Teal':   ['#2a8c95', '#13606a'],
  'Navy':   ['#0a4a5c', '#06303d'],
  'Coral':  ['#e07a3c', '#cc6428'],
};
const BG = { 'Quente': '#fbf6ef', 'Neutro': '#f3f5f5' };
const HERO_IMG = {
  'Piscina (pôr do sol)': 'assets/piscina-hero.jpg',
  'Piscinas (aérea)':     'assets/piscinas-aerea.jpg',
  'Quadra & playground':  'assets/quadra-playground.jpg',
  'Pista de caminhada':   'assets/pista-caminhada.jpg',
};
const HEADLINES = {
  'Conquiste seu lugar':   'Conquiste agora seu lugar.',
  'O momento é agora':     'Existe um momento que muda tudo. É agora.',
  'Viver melhor':          'Mais do que morar. Viver melhor todos os dias.',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "Teal",
  "bg": "Quente",
  "hero": "Piscina (pôr do sol)",
  "headline": "Conquiste seu lugar"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[t.accent] || ACCENTS.Coral;
    root.style.setProperty('--accent', a[0]);
    root.style.setProperty('--accent-deep', a[1]);
  }, [t.accent]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--bg', BG[t.bg] || BG.Quente);
  }, [t.bg]);

  React.useEffect(() => {
    if (window.__setHeroImage) window.__setHeroImage(HERO_IMG[t.hero] || HERO_IMG['Piscina (pôr do sol)']);
  }, [t.hero]);

  React.useEffect(() => {
    if (window.__setHeroHeadline) window.__setHeroHeadline(HEADLINES[t.headline] || HEADLINES['Conquiste seu lugar']);
  }, [t.headline]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Marca" />
      <TweakRadio label="Cor de destaque" value={t.accent}
        options={['Teal', 'Navy', 'Coral']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakRadio label="Fundo" value={t.bg}
        options={['Quente', 'Neutro']}
        onChange={(v) => setTweak('bg', v)} />
      <TweakSection label="Topo (hero)" />
      <TweakSelect label="Imagem do hero" value={t.hero}
        options={Object.keys(HERO_IMG)}
        onChange={(v) => setTweak('hero', v)} />
      <TweakSelect label="Headline" value={t.headline}
        options={Object.keys(HEADLINES)}
        onChange={(v) => setTweak('headline', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<App />);
