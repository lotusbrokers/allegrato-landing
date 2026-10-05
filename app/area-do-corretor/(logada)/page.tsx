import Link from 'next/link';
import BuscaGlobal from '@/components/area-do-corretor/BuscaGlobal';
import { Atalho, AtalhoDaSecao, CartaoDestaque } from '@/components/area-do-corretor/Cartoes';
import { ListaSalva } from '@/components/area-do-corretor/Memoria';
import Icone from '@/components/area-do-corretor/Icone';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo, construtorasDoCatalogo, destaques, indiceDeBusca } from '@/lib/area-do-corretor/dados';
import { driveConfigurado, indiceDoDrive, mapaDoDrive, rotaDaPasta, type MapaDoDrive } from '@/lib/area-do-corretor/drive';
import { iconeDaPasta } from '@/lib/area-do-corretor/drive-regras';
import { SECOES, mapaDosLancamentos } from '@/lib/area-do-corretor/secoes';
import { ROTA_BASE, podeGerenciar } from '@/lib/area-do-corretor/acesso';
import estilos from '@/components/area-do-corretor/area.module.css';

export default async function InicioDaArea() {
  const corretor = await exigirCorretor();
  const [dados, mapa] = await Promise.all([
    catalogo(),
    driveConfigurado() ? mapaDoDrive().catch((): MapaDoDrive | null => null) : Promise.resolve(null),
  ]);
  const oportunidades = destaques(dados);
  const contagem: Record<string, number> = {
    lancamentos: dados.lancamentos.length,
    terceiros: dados.imoveis.length,
    construtoras: construtorasDoCatalogo(dados.lancamentos).length,
  };
  const indice = [...indiceDeBusca(dados), ...(mapa ? indiceDoDrive(mapa) : [])];
  const mapaGoogle = mapaDosLancamentos();

  return (
    <>
      <section className={estilos.saudacao}>
        <p className={estilos.ola}>Olá, {corretor.primeiroNome}</p>
        <h1 className={estilos.titulo}>Tudo o que você precisa para vender melhor.</h1>
        <p className={estilos.subtitulo}>
          Encontre lançamentos, imóveis de terceiros, construtoras e os materiais da Lotus em um só lugar.
        </p>
        <BuscaGlobal indice={indice} />
      </section>

      <section className={estilos.secao} aria-labelledby="acesso-rapido">
        <div className={estilos.cabecalhoSecao}>
          <h2 id="acesso-rapido" className={estilos.tituloSecao}>
            Acesso rápido
          </h2>
        </div>
        <div className={estilos.gradeAtalhos}>
          {SECOES.map((s) => (
            <AtalhoDaSecao key={s.chave} secao={s} contagem={contagem[s.chave]} />
          ))}
        </div>
      </section>

      <section className={estilos.secao} aria-labelledby="drive">
        <div className={estilos.cabecalhoSecao}>
          <h2 id="drive" className={estilos.tituloSecao}>
            <Icone nome="pasta" /> Materiais no Drive
          </h2>
          {mapa && mapa.secoes.length > 0 && (
            <Link href={rotaDaPasta([])} className={estilos.verTodos}>
              Ver tudo
            </Link>
          )}
        </div>
        {mapa && mapa.secoes.length > 0 ? (
          <div className={estilos.gradeAtalhos}>
            {mapa.secoes.map((p) => (
              <Atalho key={p.id} titulo={p.nome} href={p.href} icone={iconeDaPasta(p.nome)} />
            ))}
          </div>
        ) : (
          <p className={estilos.vazio}>
            {!driveConfigurado() && podeGerenciar(corretor.papel)
              ? 'A pasta do Drive ainda não está conectada: faltam GOOGLE_DRIVE_API_KEY e GOOGLE_DRIVE_PASTA_ID no ambiente do site.'
              : 'Os materiais do Drive não estão disponíveis agora. Tente de novo em instantes.'}
          </p>
        )}
      </section>

      <section className={estilos.secao} aria-labelledby="favoritos">
        <div className={estilos.cabecalhoSecao}>
          <h2 id="favoritos" className={estilos.tituloSecao}>
            <Icone nome="estrela" /> Meus favoritos
          </h2>
          <Link href={`${ROTA_BASE}/favoritos`} className={estilos.verTodos}>
            Ver todos
          </Link>
        </div>
        <ListaSalva
          usuario={corretor.id}
          lista="favoritos"
          limite={6}
          vazio="Toque em “Favoritar” num lançamento, imóvel, pasta ou arquivo para guardar aqui o que você mais usa."
        />
      </section>

      <section className={estilos.secao} aria-labelledby="recentes">
        <div className={estilos.cabecalhoSecao}>
          <h2 id="recentes" className={estilos.tituloSecao}>
            <Icone nome="relogio" /> Acessados recentemente
          </h2>
        </div>
        <ListaSalva usuario={corretor.id} lista="recentes" vazio="O que você abrir por aqui aparece nesta lista." />
      </section>

      {/* Antes das oportunidades (pedido da Lotus em 05/10/2026). Só aparece com MAPA_LANCAMENTOS_ID no ambiente. */}
      {mapaGoogle && (
        <section className={estilos.secao} aria-labelledby="mapa">
          <div className={estilos.cabecalhoSecao}>
            <h2 id="mapa" className={estilos.tituloSecao}>
              <Icone nome="mapa" /> Mapa dos lançamentos
            </h2>
            <a href={mapaGoogle.abrir} target="_blank" rel="noopener" className={estilos.verTodos}>
              Abrir no Google Maps
            </a>
          </div>
          <div className={estilos.mapa}>
            <iframe
              src={mapaGoogle.embed}
              title="Mapa dos lançamentos da Lotus no Google Maps"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* No fim da página (pedido da Lotus em 05/10/2026), numa fileira com três por vez. */}
      {oportunidades.length > 0 && (
        <section className={estilos.secao} aria-labelledby="destaques">
          <div className={estilos.cabecalhoSecao}>
            <h2 id="destaques" className={estilos.tituloSecao}>
              <Icone nome="destaque" /> Oportunidades em destaque
            </h2>
          </div>
          <div className={estilos.trilho}>
            {oportunidades.map((d) => (
              <CartaoDestaque key={d.chave} d={d} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
