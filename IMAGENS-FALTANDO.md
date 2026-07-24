# Pendências de conteúdo (dados reais a fornecer)

> Itens que a auditoria corrigiu no código **até onde dava**, mas que dependem
> de dados reais que só a Lotus tem. Nenhum número/legal foi inventado.

## Dados legais da empresa — `lib/site.ts`
Os rodapés agora leem de um único lugar (`footerLegalLine()`), e **omitem**
CRECI/CNPJ enquanto forem placeholders (`00000…`). Para exibi-los, edite
`lib/site.ts` e troque `creciPj` e `cnpj` pelos números reais — aparecem em
todas as ~15 páginas automaticamente.

## Guias de bairro (conteúdo placeholder) — `lib/bairros.ts`
`/lotus-bairro` agora é um índice; cada bairro tem sua página `/lotus-bairro/[slug]`.
**Eloy Chaves** está 100% preenchido (conteúdo real). Os outros 6 (Anhangabaú, Malota,
Medeiros, Centro-Itupeva, Reserva da Serra, Horto Florestal) têm textos `TODO` — editar
em `lib/bairros.ts` (tagline, tldr, guide, faq, dados, especialista). Enquanto `publicado:
false`, essas páginas ficam `noindex`. Os imóveis de cada bairro vêm do banco filtrados
por bairro — hoje só "Jardim Colonial" (CA054) tem imóvel; os demais mostram empty-state.

## Corretores (dados fictícios) — `components/LotusCorretores.tsx` e `LotusSobre.tsx`
Nomes, CRECIs (`CRECI 000001-F`…) e fotos são **placeholders de pessoas fictícias**.
Substituir por corretores reais (nome, CRECI, foto). Enquanto não houver foto, o
avatar mostra as iniciais do nome (fallback já implementado — não fica mais vazio).

---

# Imagens faltando (404) nas landings

Os componentes referenciam estes arquivos, mas eles **não existem em `public/`** → 404 em produção,
fazendo galerias inteiras renderizarem como blocos vazios.

**Ação:** subir os arquivos reais nos caminhos abaixo (mantendo nomes/extensões exatos).
Auditoria: Playwright, 2026-07-22.

---

## `/altos-da-avenida` — 20 arquivos (presentes: `a000.jpg`, `a005.png`)

```
public/altos-da-avenida/a001.png            # logo do empreendimento (hero, rodapé)
public/altos-da-avenida/a002.png            # vista das torres
public/altos-da-avenida/a003.png            # background seção CTA
public/altos-da-avenida/a004.png            # família / sonho da casa própria
public/altos-da-avenida/assets/planta_58.jpg
public/altos-da-avenida/assets/planta_68.jpg
public/altos-da-avenida/assets/planta_96.jpg
public/altos-da-avenida/assets/planta_105.jpg
public/altos-da-avenida/assets/piscina.jpg
public/altos-da-avenida/assets/quadra.jpg
public/altos-da-avenida/assets/playground.jpg
public/altos-da-avenida/assets/salao_festas.jpg
public/altos-da-avenida/assets/gourmet.jpg
public/altos-da-avenida/assets/academia.jpg
public/altos-da-avenida/assets/salao_jogos.jpg
public/altos-da-avenida/assets/gamer.jpg
public/altos-da-avenida/assets/coworking.jpg
public/altos-da-avenida/assets/lounge.jpg
public/altos-da-avenida/assets/brinquedoteca.jpg
public/altos-da-avenida/assets/cinema.jpg
```

## `/jardins-do-horto` — 17 arquivos (presentes: `a003.jpg`, `a004.jpg`)

```
public/jardins-do-horto/a000.png
public/jardins-do-horto/a001.png
public/jardins-do-horto/a002.png
public/jardins-do-horto/a005.jpg
public/jardins-do-horto/a006.png
public/jardins-do-horto/a007.png
public/jardins-do-horto/a008.jpg
public/jardins-do-horto/a009.jpg
public/jardins-do-horto/a010.jpg
public/jardins-do-horto/a011.jpg
public/jardins-do-horto/a012.jpg
public/jardins-do-horto/a013.jpg
public/jardins-do-horto/a014.jpg
public/jardins-do-horto/a015.jpg
public/jardins-do-horto/a016.jpg
public/jardins-do-horto/a017.jpg
public/jardins-do-horto/a018.jpg
```

## `/vigore` — 19 arquivos (presentes: `a00.jpg`, `a18.jpg`)

```
public/vigore/a02.jpg
public/vigore/a03.jpg
public/vigore/a05.jpg
public/vigore/a06.jpg
public/vigore/a07.jpg
public/vigore/a08.jpg
public/vigore/a09.jpg
public/vigore/a10.jpg
public/vigore/a11.jpg
public/vigore/a12.jpg
public/vigore/a13.jpg
public/vigore/a14.jpg
public/vigore/a15.jpg
public/vigore/a16.jpg
public/vigore/a17.jpg
public/vigore/a19.jpg
public/vigore/a20.jpg
public/vigore/a21.jpg
public/vigore/a44.jpg
```

---

### Como reconferir depois de subir

```bash
# deve imprimir "OK" para cada arquivo
for f in $(grep -oE "a[0-9]{2}\.(jpg|png)" components/Vigore.tsx | sort -u); do
  [ -f "public/vigore/$f" ] && echo "OK $f" || echo "FALTA $f"
done
```
