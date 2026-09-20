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

## Corda e adaga genérica

Em 19 de setembro de 2026, o item `item.demo.rope` recebeu uma arte própria de
corda e as famílias de adagas conhecidas dos Packs Core e Hope & Fear passaram
a compartilhar uma arte genérica quando não declaram imagem própria. A
associação usa IDs estáveis; nomes parciais não ativam os fallbacks. Assim,
itens como Dardo de Corda e Pingente de Adaga de Ferro não recebem uma imagem
incorreta. A prioridade da imagem fornecida pelo Pack ou usuário permanece
inalterada.

As duas artes são originais, geradas com a ferramenta integrada imagegen e
finalizadas como WebP 512 × 512, qualidade 82, sem transparência. O fundo
uniforme `#080d13` mantém integração com os painéis escuros. `rope.webp` possui
35.406 bytes e `dagger.webp`, 8.014 bytes; o lote totaliza 43.420 bytes.

### Prompt final — corda

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: create one lightweight-ready catalog artwork of an ordinary adventuring rope. Scene/backdrop: perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13; no transparency simulation. Subject: one neatly coiled practical hemp rope, approximately 15 meters implied by a substantial compact coil, with one short loose end crossing naturally over the coil; ordinary medieval utility gear. Style/medium: painterly realistic game item illustration, restrained craftsmanship. Composition/framing: square image, centered complete object, three-quarter slightly top-down view, 12% empty padding, object occupies about 75% of canvas, clear silhouette readable as a small inventory thumbnail. Lighting/mood: soft neutral studio illumination, restrained warm edge highlights. Color palette: natural muted tan and brown hemp against near-black background. Materials/textures: visible twisted natural fibers, subtle wear, no decorative bindings. Constraints: exactly one rope coil; no text, letters, numbers, labels, border, frame, logo, watermark, checkerboard, fog, vignette, gradient, ground plane, glow, hands, character, hook, grappling hook, knife, bag, or extra objects; background must remain perfectly uniform #080d13.

Edição final: Use case: precise-object-edit. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: change ONLY the background of the attached rope artwork. Edit target: the just-generated coiled hemp rope image. Constraints: preserve the rope exactly—same coil, loose end, fibers, proportions, lighting, shadows on the object, scale, sharpness and complete silhouette. Replace the entire surrounding background with a perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13. No gradient, no vignette, no halo, no fog, no checkerboard, no transparency simulation, no ground plane. Keep the square canvas and existing padding. No text, border, logo, watermark or extra objects.

### Prompt final — adaga

Use case: stylized-concept. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: create one lightweight-ready generic catalog artwork for any dagger that has no dedicated image. Scene/backdrop: perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13; no transparency simulation. Subject: one ordinary practical medieval dagger, straight double-edged steel blade, modest simple crossguard, dark brown leather-wrapped grip, small plain pommel; neutral design suitable as a generic fallback for common, small, curved, parrying, casting, twisted, improved and legendary dagger entries without visually claiming any special property. Style/medium: painterly realistic game item illustration, restrained craftsmanship, no magical effects. Composition/framing: square image, centered complete weapon on a gentle diagonal from lower-left to upper-right, 14% empty padding, entire tip and pommel visible, strong readable silhouette at small inventory-thumbnail size. Lighting/mood: soft neutral studio illumination, crisp restrained highlights along the steel edge. Color palette: cool muted steel, dark brown leather, subtle aged bronze guard, near-black background. Materials/textures: lightly worn steel, practical leather wrap, understated metal fittings. Constraints: exactly one dagger; no sheath, blood, poison, runes, gems, glow, magic, ornate symbols, serrations, skulls, hands, character, extra weapons, text, letters, numbers, labels, border, frame, logo, watermark, checkerboard, fog, vignette, gradient, ground plane; background must remain perfectly uniform #080d13.

Edição final: Use case: precise-object-edit. Asset type: SoulForge fantasy RPG inventory artwork. Primary request: change ONLY the background of the attached dagger artwork. Edit target: the just-generated generic dagger image. Constraints: preserve the dagger exactly—same blade, guard, grip, pommel, proportions, diagonal placement, lighting, material, scale, sharpness and complete silhouette. Replace the entire surrounding background with a perfectly uniform solid very dark blue-black RGB (8,13,19), hex #080d13. No gradient, no vignette, no halo, no fog, no checkerboard, no transparency simulation, no ground plane. Keep the square canvas and existing padding. No text, border, logo, watermark or extra objects.
