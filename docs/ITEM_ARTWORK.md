# Artes genéricas de itens — piloto

## Poções de vida e vigor

Seis artes geradas com imagegen integrado. Vida usa vermelho-rubi; vigor usa amarelo-âmbar. Menor: frasco estreito; normal: arredondado; maior: largo e facetado. WebP 512 × 512, qualidade 82, fundo escuro, sem transparência. Vinculação apenas por categoria consumível e nomes exatos (vida/cura, vigor; health/healing, stamina/vigor), incluindo variantes menor/normal/maior e nomes bilíngues. Sem alterar efeitos ou substituir imagens próprias. Disponíveis nos mesmos previews compartilhados do inventário, seleção e Compendium; precache offline existente inclui WebP.

### Prompts e arquivos finais

#### public/assets/items/generic/life-potion-minor.webp

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. One single complete potion bottle, centered upright in a square image with 15% empty padding. Painterly realistic game item illustration, practical medieval craftsmanship, clear glass, cork stopper, subtle leather neck binding. Soft neutral studio illumination and crisp edge highlights, readable at small thumbnail sizes. Background perfectly uniform solid very dark blue-black #080d13. No text, label, symbols, watermark, frame, checkerboard, fog, glowing orb, excessive bloom, extra objects or scenery. Subject: MINOR potency: a small narrow slender vial with simple cork, thin modest neck binding. Clearly slim silhouette. Liquid fills roughly two thirds of bottle. Health potion containing rich ruby RED liquid, unmistakably red.

#### public/assets/items/generic/vigor-potion-minor.webp

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. One single complete potion bottle, centered upright in a square image with 15% empty padding. Painterly realistic game item illustration, practical medieval craftsmanship, clear glass, cork stopper, subtle leather neck binding. Soft neutral studio illumination and crisp edge highlights, readable at small thumbnail sizes. Background perfectly uniform solid very dark blue-black #080d13. No text, label, symbols, watermark, frame, checkerboard, fog, glowing orb, excessive bloom, extra objects or scenery. Subject: MINOR potency: a small narrow slender vial with simple cork, thin modest neck binding. Clearly slim silhouette. Liquid fills roughly two thirds of bottle. Vigor potion restoring stress, containing luminous but not glowing YELLOW-AMBER liquid, distinctly yellow not orange.

#### public/assets/items/generic/life-potion-normal.webp

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. One single complete potion bottle, centered upright in a square image with 15% empty padding. Painterly realistic game item illustration, practical medieval craftsmanship, clear glass, cork stopper, subtle leather neck binding. Soft neutral studio illumination and crisp edge highlights, readable at small thumbnail sizes. Background perfectly uniform solid very dark blue-black #080d13. No text, label, symbols, watermark, frame, checkerboard, fog, glowing orb, excessive bloom, extra objects or scenery. Subject: NORMAL potency: a rounded round-bellied flask with short neck, simple cork and modest neck binding. Clearly circular silhouette. Liquid fills roughly two thirds of bottle. Health potion containing rich ruby RED liquid, unmistakably red.

#### public/assets/items/generic/vigor-potion-normal.webp

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. One single complete potion bottle, centered upright in a square image with 15% empty padding. Painterly realistic game item illustration, practical medieval craftsmanship, clear glass, cork stopper, subtle leather neck binding. Soft neutral studio illumination and crisp edge highlights, readable at small thumbnail sizes. Background perfectly uniform solid very dark blue-black #080d13. No text, label, symbols, watermark, frame, checkerboard, fog, glowing orb, excessive bloom, extra objects or scenery. Subject: NORMAL potency: a rounded round-bellied flask with short neck, simple cork and modest neck binding. Clearly circular silhouette. Liquid fills roughly two thirds of bottle. Vigor potion restoring stress, containing luminous but not glowing YELLOW-AMBER liquid, distinctly yellow not orange.

#### public/assets/items/generic/life-potion-major.webp

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. One single complete potion bottle, centered upright in a square image with 15% empty padding. Painterly realistic game item illustration, practical medieval craftsmanship, clear glass, cork stopper, subtle leather neck binding. Soft neutral studio illumination and crisp edge highlights, readable at small thumbnail sizes. Background perfectly uniform solid very dark blue-black #080d13. No text, label, symbols, watermark, frame, checkerboard, fog, glowing orb, excessive bloom, extra objects or scenery. Subject: MAJOR potency: a broad robust squat flask with faceted shoulders, thicker neck binding and restrained metal collar. Clearly wide substantial silhouette, slightly finer craftsmanship. Liquid fills roughly two thirds of bottle. Health potion containing rich ruby RED liquid, unmistakably red.

#### public/assets/items/generic/vigor-potion-major.webp

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. One single complete potion bottle, centered upright in a square image with 15% empty padding. Painterly realistic game item illustration, practical medieval craftsmanship, clear glass, cork stopper, subtle leather neck binding. Soft neutral studio illumination and crisp edge highlights, readable at small thumbnail sizes. Background perfectly uniform solid very dark blue-black #080d13. No text, label, symbols, watermark, frame, checkerboard, fog, glowing orb, excessive bloom, extra objects or scenery. Subject: MAJOR potency: a broad robust squat flask with faceted shoulders, thicker neck binding and restrained metal collar. Clearly wide substantial silhouette, slightly finer craftsmanship. Liquid fills roughly two thirds of bottle. Vigor potion restoring stress, containing luminous but not glowing YELLOW-AMBER liquid, distinctly yellow not orange.


Geradas com a ferramenta integrada de imagens (imagegen), sem CLI/API externa. Arte original de inventário, não extraída dos livros. Arquivos finais em `public/assets/items/generic/`: `torch.webp`, `gold.webp`, `leather-armor.webp`. Derivados WebP de 512 × 512, qualidade 82; originais preservados na pasta de imagens geradas do Codex.

As primeiras saídas desenharam um quadriculado, sem transparência real. Foram corrigidas pelo gerador para fundo escuro #080d13. Estas artes não possuem alpha; não tratá-las como recortes transparentes. O painel usa fundo compatível e preserva o enquadramento com contain.

Prioridade: imagem própria → alias exato e categoria compatível → símbolo. O resolvedor `src/features/items/itemArtwork.ts` é apenas de apresentação: não modifica inventário nem packs e usa BASE_URL para GitHub Pages. As três artes são incluídas no precache pelo padrão WebP existente da PWA. Não fazer correspondência por fragmentos de nomes para evitar atribuir couro a armadura metálica ou arte comum a item especial.

## Prompts finais

Foram usados os prompts iniciais abaixo, seguidos da mesma edição de fundo para cada resultado.

### Tocha

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork, one isolated object on genuinely transparent alpha background, square 1024x1024. Painterly realistic game item illustration, restrained craftsmanship, soft neutral studio illumination with clear edge highlights readable on near-black UI. Centered complete object with 12% transparent padding, occupies roughly 75% canvas. No text, no border, no watermark, no ground plane, no background fog, no glowing orb, no extra items. Subject: a single ordinary wooden handheld torch, diagonal lower-left to upper-right, cloth-wrapped head burning with a small warm amber flame. Practical medieval tool, realistic wood and cloth. Flame localized, no wide bloom or smoke cloud.

### Ouro

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork, one isolated object on genuinely transparent alpha background, square 1024x1024. Painterly realistic game item illustration, restrained craftsmanship, soft neutral studio illumination with clear edge highlights readable on near-black UI. Centered complete object with 12% transparent padding, occupies roughly 75% canvas. No text, no border, no watermark, no ground plane, no background fog, no glowing orb, no extra items. Subject: a small compact pile of ordinary medieval gold coins, a few overlapping flat coins and one short stack, three-quarter view. Warm muted gold metal, subtle wear, simple abstract stamped markings, no readable lettering. No gemstones, pouch, treasure chest or magic.

### Armadura de couro

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork, one isolated object on genuinely transparent alpha background, square 1024x1024. Painterly realistic game item illustration, restrained craftsmanship, soft neutral studio illumination with clear edge highlights readable on near-black UI. Centered complete object with 12% transparent padding, occupies roughly 75% canvas. No text, no border, no watermark, no ground plane, no background fog, no glowing orb, no extra items. Subject: a single ordinary brown leather torso armor, sleeveless leather cuirass shown three-quarter front view, empty without wearer. Practical stitched panels, restrained buckles and shoulder straps, softly worn brown leather. No metal plate, helmet, weapon, cloak, humanoid body or elaborate ornaments.

### Edição de fundo

Edit target: attached generated inventory object. Change ONLY the background: REMOVE ALL checkerboard squares and replace the entire background with perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13. No transparency simulation, no checkerboard, no fog, no vignette or gradient. Preserve the object, shape, material, lighting and complete silhouette. Keep 12% empty padding so object fits small RPG inventory card. Output a square image.

## Adaga genérica

As famílias de adagas conhecidas dos Packs Core e Hope & Fear compartilham uma
arte genérica quando não declaram imagem própria. A associação usa IDs
estáveis; nomes parciais não ativam os fallbacks. Assim, itens como Dardo de
Corda e Pingente de Adaga de Ferro não recebem uma imagem incorreta. A
prioridade da imagem fornecida pelo Pack ou usuário permanece inalterada.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada
como WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme
`#080d13` mantém integração com os painéis escuros. `dagger.webp` possui
8.014 bytes.

### Prompt final — corda

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: create one lightweight-ready catalog artwork of an ordinary adventuring rope. Scene/backdrop: perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13; no transparency simulation. Subject: one neatly coiled practical hemp rope, approximately 15 meters implied by a substantial compact coil, with one short loose end crossing naturally over the coil; ordinary medieval utility gear. Style/medium: painterly realistic game item illustration, restrained craftsmanship. Composition/framing: square image, centered complete object, three-quarter slightly top-down view, 12% empty padding, object occupies about 75% of canvas, clear silhouette readable as a small inventory thumbnail. Lighting/mood: soft neutral studio illumination, restrained warm edge highlights. Color palette: natural muted tan and brown hemp against near-black background. Materials/textures: visible twisted natural fibers, subtle wear, no decorative bindings. Constraints: exactly one rope coil; no text, letters, numbers, labels, border, frame, logo, watermark, checkerboard, fog, vignette, gradient, ground plane, glow, hands, character, hook, grappling hook, knife, bag, or extra objects; background must remain perfectly uniform #080d13.

Edição final: Use case: precise-object-edit. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: change ONLY the background of the attached rope artwork. Edit target: the just-generated coiled hemp rope image. Constraints: preserve the rope exactly—same coil, loose end, fibers, proportions, lighting, shadows on the object, scale, sharpness and complete silhouette. Replace the entire surrounding background with a perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13. No gradient, no vignette, no halo, no fog, no checkerboard, no transparency simulation, no ground plane. Keep the square canvas and existing padding. No text, border, logo, watermark or extra objects.

### Prompt final — adaga

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: create one lightweight-ready generic catalog artwork for any dagger that has no dedicated image. Scene/backdrop: perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13; no transparency simulation. Subject: one ordinary practical medieval dagger, straight double-edged steel blade, modest simple crossguard, dark brown leather-wrapped grip, small plain pommel; neutral design suitable as a generic fallback for common, small, curved, parrying, casting, twisted, improved and legendary dagger entries without visually claiming any special property. Style/medium: painterly realistic game item illustration, restrained craftsmanship, no magical effects. Composition/framing: square image, centered complete weapon on a gentle diagonal from lower-left to upper-right, 14% empty padding, entire tip and pommel visible, strong readable silhouette at small inventory-thumbnail size. Lighting/mood: soft neutral studio illumination, crisp restrained highlights along the steel edge. Color palette: cool muted steel, dark brown leather, subtle aged bronze guard, near-black background. Materials/textures: lightly worn steel, practical leather wrap, understated metal fittings. Constraints: exactly one dagger; no sheath, blood, poison, runes, gems, glow, magic, ornate symbols, serrations, skulls, hands, character, extra weapons, text, letters, numbers, labels, border, frame, logo, watermark, checkerboard, fog, vignette, gradient, ground plane; background must remain perfectly uniform #080d13.

Edição final: Use case: precise-object-edit. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: change ONLY the background of the attached dagger artwork. Edit target: the just-generated generic dagger image. Constraints: preserve the dagger exactly—same blade, guard, grip, pommel, proportions, diagonal placement, lighting, material, scale, sharpness and complete silhouette. Replace the entire surrounding background with a perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13. No gradient, no vignette, no halo, no fog, no checkerboard, no transparency simulation, no ground plane. Keep the square canvas and existing padding. No text, border, logo, watermark or extra objects.

## Espada genérica

As espadas curta, larga, longa e grande do Pack Core, incluindo as progressões,
compartilham uma única arte neutra quando não declaram imagem própria. A Espada
Larga Urok também usa esse fallback. As armas de silhueta ou identidade própria,
como espada-chicote, espada-bengala, espada de duas pontas, Espada de Luz e
Chama e Espada de Conjuração, continuam sem associação genérica para não receber
uma ilustração enganosa.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra a imagem aos painéis escuros. O cabo longo para duas mãos e a guarda
ampla diferenciam sua silhueta da adaga genérica. `sword.webp` possui 8.122
bytes.

### Prompt final — espada

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic sword fallback. Primary request: create one generic, neutral medieval
sword suitable as fallback artwork for ordinary short swords, broadswords,
longswords and greatswords. Subject: versatile straight double-edged steel blade
with a subtle central fuller, broad straight aged-bronze crossguard, a long
two-handed dark-brown leather-wrapped grip and a restrained elongated pommel.
Scene/backdrop: perfectly
uniform solid very dark blue-black `#080d13`; no transparency simulation.
Composition: square canvas, one complete isolated weapon centered on a gentle
diagonal from lower-left tip to upper-right pommel, 14% empty padding and a
silhouette readable em miniatura. Style: pintura digital realista de fantasia,
luz de estúdio neutra e reflexos contidos. Sem bainha, sangue, runas, gemas,
magia, ornamentos, mãos, personagens, armas extras, texto, moldura, marca,
névoa, gradiente ou plano de chão.

## Cajado genérico

As famílias convencionais Bastão, Bastão Curto, Bastão Duplo e Grande Cajado do
Pack Core, incluindo todas as progressões, compartilham uma arte genérica quando
não declaram imagem própria. Cajados nomeados, cetros e varinhas continuam fora
desse fallback para preservar suas silhuetas e propriedades particulares.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
mantém a integração com os painéis escuros. `staff.webp` possui 6.376 bytes.

### Prompt final — cajado

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic staff fallback. Primary request: criar um único bastão medieval neutro
para representar bastões, bastões curtos, bastões duplos e grandes cajados
comuns. Subject: haste longa e espessa de madeira nogueira escura, veios gastos
discretos e duas pontas cegas reforçadas com simples aros de ferro escuro; sem
lâmina, ponta de lança, cristal, orbe, runa, gema ou magia. Scene/backdrop:
fundo perfeitamente uniforme `#080d13`. Composition: objeto completo isolado,
diagonal de baixo à esquerda para cima à direita, 12% de margem e leitura clara
em miniatura. Sem personagens, mãos, itens extras, texto, moldura, marca,
névoa, gradiente ou plano de chão.

## Armadura metálica genérica

As famílias convencionais Cota de Malha e Armadura de Placas do Pack Core, além
de Brigantina, Armadura de Bandas e Cota de Escamas de *Hope & Fear*, incluindo
as progressões, compartilham uma arte neutra quando não declaram imagem própria.
Armaduras nomeadas, mágicas ou com silhueta singular — como Placas Espinhadas,
Armadura de Coral e Exotraje Forjado em Runas — permanecem fora desse fallback.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. A peça combina placa lisa, malha e lâminas
sobrepostas, sem insígnias, para representar as famílias metálicas sem sugerir
uma propriedade particular. `metal-armor.webp` possui 29.758 bytes.

### Prompt final — armadura metálica

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic metal armor fallback. Subject: uma única couraça vazia de aço escurecido
em três quartos frontal, com peitoral liso, malha visível nas cavas, lâminas
metálicas sobrepostas nos ombros e saia, e poucas tiras simples de couro escuro.
Sem brasão, ouro, runas, gemas ou magia. Scene/backdrop: fundo perfeitamente
uniforme `#080d13`. Composition: peça isolada e centralizada, com 10–12% de
margem e leitura clara em miniatura. Luz neutra e contida, sem brilho intenso.
Sem corpo, manequim, elmo, armas, escudo, personagens, texto, moldura, marca,
névoa, gradiente ou plano de chão.

## Arco genérico

As famílias convencionais Arco Curto e Arco Longo do Pack Core, com todas as
progressões, e o Arco Grande compartilham uma arte neutra quando não declaram
imagem própria. Arcos nomeados ou de silhueta característica — como Arco
Espinhado, Arco Dourado, Arco de Cardo e Arco de Haste Partida — permanecem fora
desse fallback.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. `bow.webp` possui 6.038 bytes.

### Prompt final — arco

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic bow fallback. Subject: um único arco recurvo medieval de nogueira escura,
inteiramente encordoado, com empunhadura central de couro escuro e discretas
ponteiras de ferro; sem flecha. Scene/backdrop: fundo perfeitamente uniforme
`#080d13`. Composition: objeto completo isolado em diagonal de baixo à esquerda
para cima à direita, 12% de margem e leitura clara em miniatura. Luz de estúdio
neutra e reflexos contidos. Sem aljava, mãos, personagem, alvo, magia, runas,
gemas, brasão, texto, moldura, marca, névoa, gradiente ou plano de chão.

## Escudo genérico

As famílias convencionais Escudo Redondo do Pack Core, com todas as progressões,
e Broquel compartilham uma arte neutra quando não declaram imagem própria. O
Escudo Torre e escudos especiais, como Escudo Espinhoso, Escudo da Bravura e
Escudo Rúnico, permanecem fora desse fallback por terem formato ou identidade
particulares.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. `shield.webp` possui 30.764 bytes.

### Prompt final — escudo

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic shield fallback. Subject: um único escudo redondo medieval de pranchas
de nogueira escura, com bordo estreito e chefe central circular em ferro fosco;
desgaste prático discreto, sem brasão, runa, espinhos, ouro ou magia.
Scene/backdrop: fundo perfeitamente uniforme `#080d13`. Composition: objeto
completo isolado e centralizado, com 12% de margem e leitura clara em miniatura.
Luz de estúdio neutra e contida. Sem personagem, mãos, arma, elmo, cenário,
flechas, texto, moldura, marca, névoa, gradiente ou plano de chão.

## Arma de impacto genérica

As famílias convencionais Maça e Martelo de Guerra do Pack Core, com todas as
progressões, compartilham uma arte neutra quando não declaram imagem própria.
Mangual Duplo e armas nomeadas ou incomuns, como Maça-Foguete, Martelo da Ira e
Martelo Relâmpago, permanecem fora desse fallback para preservar suas identidades
e silhuetas específicas.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. `blunt-weapon.webp` possui 11.432 bytes.

### Prompt final — arma de impacto

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic blunt weapon fallback. Subject: uma única maça de guerra de uma mão, com
cabo de freixo escuro revestido de couro marrom, pomo simples de aço e cabeça de
ferro fosco com uma face quadrada de martelo e flanges curtas no lado oposto.
Sem espinhos, correntes, lâmina de machado, ponta de lança, ouro, gema, runa ou
magia. Scene/backdrop: fundo perfeitamente uniforme `#080d13`. Composition:
objeto inteiro isolado em diagonal de baixo à esquerda para cima à direita, com
14% de margem e leitura clara em miniatura. Luz de estúdio neutra e contida. Sem
personagem, mãos, escudo, cenário, texto, moldura, marca, névoa, gradiente ou
plano de chão.

## Lança genérica

As quatro progressões da Lança convencional do Pack Core compartilham uma arte
neutra quando não declaram imagem própria. Armas nomeadas, mágicas ou de
silhueta particular permanecem fora desse fallback para preservar suas
identidades específicas.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. `spear.webp` possui 5.822 bytes.

### Prompt final — lança

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic spear fallback. Subject: uma única lança medieval prática e neutra, com
haste longa e reta de freixo, ponta única de aço em forma de folha, colar estreito
de metal escuro sob a ponta e pequeno conto de aço. Sem bandeira, gancho, guarda,
lâmina de machado, forquilha, ornamento, runa, gema, ouro ou magia.
Scene/backdrop: fundo perfeitamente uniforme `#080d13`. Composition: objeto
inteiro isolado em diagonal de baixo à esquerda para cima à direita, com cerca
de 12% de margem e leitura clara em miniatura. Luz de estúdio neutra e reflexos
contidos. Sem personagem, mãos, escudo, armas extras, cenário, texto, moldura,
marca, névoa, gradiente ou plano de chão.

## Machado genérico

As quatro progressões do Machado de Batalha convencional do Pack Core
compartilham uma arte neutra quando não declaram imagem própria. Machado Sagrado
e armas nomeadas, mágicas ou de silhueta particular permanecem fora desse
fallback para preservar suas identidades específicas.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. `battleaxe.webp` possui 9.806 bytes.

### Prompt final — machado

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic battle axe fallback. Subject: um único machado de batalha medieval
prático e neutro, com haste reta de freixo escuro, empunhadura inferior revestida
de couro marrom, pomo simples de aço, lâmina única larga de aço em meia-lua e
contrapeso curto e rombudo no lado oposto. Sem lâmina dupla, espinhos, gancho,
runas, gemas, ouro, caveiras, ornamentos ou magia. Scene/backdrop: fundo
perfeitamente uniforme `#080d13`. Composition: objeto inteiro isolado em
diagonal de baixo à esquerda para cima à direita, com 12–14% de margem e leitura
clara em miniatura. Luz de estúdio neutra e reflexos contidos. Sem personagem,
mãos, escudo, armas extras, cenário, texto, moldura, marca, névoa, gradiente ou
plano de chão.

## Besta genérica

As quatro progressões da Besta convencional do Pack Core compartilham uma arte
neutra quando não declaram imagem própria. Bestas nomeadas, mágicas ou de
silhueta particular permanecem fora desse fallback para preservar suas
identidades específicas.

A arte é original, gerada com a ferramenta integrada imagegen e finalizada como
WebP 512 × 512, qualidade 82, sem transparência. O fundo uniforme `#080d13`
integra o ícone aos painéis escuros. `crossbow.webp` possui 12.390 bytes.

### Prompt final — besta

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork,
generic crossbow fallback. Subject: uma única besta medieval prática e neutra,
descarregada, com coronha de nogueira escura, arco frontal simples de aço,
corda fina retesada, caixa de gatilho compacta de metal escuro, empunhadura de
couro gasta e pequeno estribo de aço. Sem virote, flecha, mira, manivela,
carregador, runa, gema, ouro, ornamento ou magia. Scene/backdrop: fundo
perfeitamente uniforme `#080d13`. Composition: objeto inteiro isolado em
diagonal de baixo à esquerda para cima à direita, com margem e leitura clara em
miniatura. Luz de estúdio neutra e reflexos contidos. Sem personagem, mãos,
aljava, armas extras, cenário, texto, moldura, marca, névoa, gradiente ou plano
de chão.
