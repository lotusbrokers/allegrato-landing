import { Atalho, AtalhoExterno } from '@/components/area-do-corretor/Cartoes';
import Icone from '@/components/area-do-corretor/Icone';
import { ROTA_GESTOR } from '@/lib/area-do-corretor/acesso';
import { chaveDoDriveConfigurada } from '@/lib/area-do-corretor/drive';
import { URL_DASHBOARD } from '@/lib/area-do-corretor/secoes';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { MODULOS_DA_DASHBOARD, linkDaDashboard } from '@/lib/area-do-gestor/dashboard';
import { pastasDaGestao } from '@/lib/area-do-gestor/pastas';
import estilos from '@/components/area-do-corretor/area.module.css';

export default async function InicioDoGestor() {
  const gestor = await exigirGestor();
  const pastas = pastasDaGestao();
  // Só o nome das variáveis, nunca o valor: a tela diz o que falta configurar no servidor.
  const faltando = [
    ...(chaveDoDriveConfigurada() ? [] : ['GOOGLE_DRIVE_API_KEY']),
    ...pastas.filter((p) => !p.id).map((p) => p.variavel),
  ];

  return (
    <>
      <section className={estilos.saudacao}>
        <p className={estilos.ola}>Olá, {gestor.primeiroNome}</p>
        <h1 className={estilos.titulo}>Área do Gestor</h1>
        <p className={estilos.subtitulo}>As pastas da gestão no Drive e o caminho para cada módulo da Dashboard.</p>
        <div className={estilos.acoes}>
          <a href={URL_DASHBOARD} target="_blank" rel="noopener" className={estilos.botao}>
            <Icone nome="painel" /> Abrir a Dashboard
          </a>
        </div>
      </section>

      <section className={estilos.secao} aria-labelledby="pastas-da-gestao">
        <div className={estilos.cabecalhoSecao}>
          <h2 id="pastas-da-gestao" className={estilos.tituloSecao}>
            <Icone nome="pasta" /> Pastas no Drive
          </h2>
        </div>
        <div className={estilos.gradeAtalhos}>
          {pastas.map((p) => (
            <Atalho key={p.chave} titulo={p.titulo} resumo={p.resumo} href={`${ROTA_GESTOR}/drive/${p.chave}`} icone="pasta" />
          ))}
        </div>
        {faltando.length > 0 && (
          <div className={estilos.aviso} role="status" style={{ marginTop: 14 }}>
            <h3>Falta conectar as pastas no servidor</h3>
            <p>Variáveis de ambiente que o site ainda não tem: {faltando.join(', ')}.</p>
          </div>
        )}
      </section>

      {MODULOS_DA_DASHBOARD.map((grupo) => (
        <section key={grupo.titulo} className={estilos.secao} aria-label={`Dashboard: ${grupo.titulo}`}>
          <div className={estilos.cabecalhoSecao}>
            <h2 className={estilos.tituloSecao}>
              <Icone nome={grupo.icone} /> {grupo.titulo}
            </h2>
          </div>
          <div className={estilos.gradeAtalhos}>
            {grupo.modulos.map((m) => (
              <AtalhoExterno key={m.rota} titulo={m.titulo} resumo={m.resumo} href={linkDaDashboard(m.rota)} icone={grupo.icone} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
