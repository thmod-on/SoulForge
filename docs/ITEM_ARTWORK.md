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
