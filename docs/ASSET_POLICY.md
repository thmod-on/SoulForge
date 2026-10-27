# Política de artes e assets visuais

## Status

Este documento é um contrato obrigatório do projeto. Deve ser consultado antes de gerar, importar, incorporar ou alterar imagens distribuídas com o SoulForge.

Ele complementa:

- [Identidade visual](VISUAL_IDENTITY.md), que define aparência e uso na interface;
- [PWA e uso offline](PWA_OFFLINE.md), que define carregamento e cache;
- [Política de conteúdo](CONTENT_POLICY.md), que define origem, licença e distribuição;
- [Packs](PACKS.md), que define a fronteira entre conteúdo público e privado.

Em caso de conflito, a política de conteúdo e os contratos arquiteturais prevalecem.

## Objetivo

Permitir que o catálogo receba artes gradualmente sem tornar a instalação lenta, consumir armazenamento de forma desnecessária ou comprometer o uso offline no iPad.

Uma arte é um apoio visual. Nenhuma regra, escolha ou estado pode depender exclusivamente dela.

## Regras permanentes

1. O SoulForge deve continuar totalmente utilizável quando uma imagem estiver ausente ou falhar.
2. Não incluir arte oficial, logotipos, marcas ou elementos protegidos sem autorização explícita de distribuição.
3. Artes distribuídas pelo projeto devem ser originais ou possuir licença registrada e compatível.
4. Não buscar imagens de terceiros em tempo de execução nem fazer *hotlink* de URLs externas.
5. Definições e fichas devem se relacionar por IDs estáveis; nomes e descrições nunca identificam uma arte.
6. A resolução de imagens deve ser centralizada por tipo de Definition. Não criar associações dispersas em telas ou no `main.ts`.
7. Imagens próprias do usuário ou declaradas pelo Pack têm prioridade sobre um fallback visual do SoulForge.
8. Um fallback incorporado pelo SoulForge é somente apresentação e não deve alterar nem persistir uma Definition importada.
9. O catálogo textual, a criação de personagem e a ficha não podem depender do download prévio de um pacote de arte.
10. Todo lote de imagens deve ser validado no recorte real da miniatura, no detalhe e em uma tela equivalente ao iPad horizontal.

## Prioridade de resolução

Aplicar sempre esta ordem:

1. imagem fornecida pelo usuário;
2. imagem declarada pela Definition ou por seu Pack;
3. arte original incorporada pelo SoulForge e associada ao ID estável;
4. fallback abstrato ou símbolo da categoria;
5. conteúdo textual sem imagem.

Não fazer correspondência parcial por nome. Traduções, renomeações e nomes semelhantes podem associar uma imagem incorreta.

## Arquivos de origem e arquivos de entrega

### Originais

- O arquivo mestre gerado ou editável não precisa permanecer no Git.
- Quando for importante reproduzir a direção artística, registrar o prompt, a ferramenta, a data e as restrições em documentação ou manifesto.
- Nunca usar o arquivo mestre de vários megabytes diretamente no build apenas porque ele já está pronto.

### Entrega no aplicativo

- Preferir WebP para ilustrações e WebP com transparência para objetos isolados.
- JPEG é aceito para imagens opacas quando a conversão para WebP ainda não estiver disponível; deve ser tratado como formato de transição.
- PNG fica reservado a transparência ou elementos cuja nitidez realmente exija o formato.
- SVG é apropriado para ícones próprios, não para embutir ilustração oficial ou raster codificado.
- Não incorporar imagens públicas como Base64 em JavaScript, CSS ou JSON. Arquivos separados permitem cache, deduplicação e atualização eficientes.

### Dimensão e compressão

Para uma arte de catálogo:

| Representação | Dimensão recomendada | Meta de tamanho | Limite por arquivo |
| --- | --- | --- | --- |
| Miniatura | até 384 px no maior lado | até 45 KB | 70 KB |
| Detalhe quadrado | entre 768 e 960 px no maior lado | até 150 KB | 220 KB |
| Banner vertical | 768 px de largura e até 1.152 px de altura | até 150 KB | 220 KB |
| Ícone | dimensão mínima adequada ao uso | até 20 KB | 40 KB |

- Preservar a proporção definida em `VISUAL_IDENTITY.md` e manter o foco dentro da área segura para `cover`.
- Não aumentar artificialmente uma imagem menor.
- Uma exceção acima do limite precisa ser justificada no manifesto e compensada no orçamento do lote.
- Enquanto houver poucas artes, uma única versão de detalhe pode atender miniatura e modal. A versão de miniatura torna-se obrigatória no Estágio 2.

### Geração reproduzível

Instale a ferramenta local uma vez com `python -m pip install -r requirements-artwork.txt`.
Para cada arte, use o comando abaixo; ele preserva a proporção, respeita a
orientação EXIF, não amplia a origem e gera os dois derivados WebP:

```text
pnpm run artwork:derive -- --input mestre.png --detail public/assets/items/generic/exemplo.webp --thumbnail public/assets/items/generic/exemplo.thumb.webp
```

Os limites padrão são 960 px para detalhe, 384 px para miniatura e qualidade
WebP 82. Podem ser ajustados com `--detail-max`, `--thumbnail-max` e
`--quality`, sempre dentro dos limites desta política.

## Estrutura e nomes

Usar, quando aplicável:

```text
public/assets/<tipo>/<colecao>/<slug-estavel>.webp
public/assets/<tipo>/<colecao>/<slug-estavel>.thumb.webp
public/assets/classes/<colecao>/<slug-estavel>-emblem.webp
public/assets/classes/<colecao>/<slug-estavel>-banner.webp
```

- `<tipo>` representa `cards`, `items`, `ancestries`, `communities`, `classes` ou outro tipo real de Definition.
- `<colecao>` agrupa a origem visual sem depender do nome exibido ao usuário, por exemplo `generic` ou um identificador público autorizado.
- O nome do arquivo deve ser estável, minúsculo e sem caracteres localizados.
- Uma arte substituída deve manter o caminho quando representar a mesma Definition, permitindo atualização eficiente do cache.

## Orçamento do aplicativo

Os limites abaixo são gatilhos arquiteturais, não metas a serem preenchidas:

| Medida | Faixa saudável | Revisão obrigatória |
| --- | --- | --- |
| Precache total da PWA | até 10 MiB | acima de 15 MiB |
| Artes públicas incorporadas | até 10 MiB | acima de 15 MiB |
| Quantidade de artes de catálogo incorporadas | até 40 | acima de 40 |

- Nenhum novo lote deve ser incorporado se fizer o precache ultrapassar 15 MiB sem antes executar o Estágio 2.
- O relatório do build deve registrar o tamanho do precache antes e depois do lote.
- O tamanho comprimido de rede não substitui a análise de memória: uma imagem 960 × 960 pode ocupar cerca de 3,5 MiB quando decodificada.
- Grades devem evitar manter imagens de detalhe desnecessariamente decodificadas fora da área visível.

## Estratégia de evolução

### Estágio 1 — coleção pequena

Aplicável enquanto o projeto permanecer dentro da faixa saudável.

- Artes selecionadas ficam em `public/assets/` e podem integrar o precache.
- Uma única representação otimizada pode servir à miniatura e ao detalhe.
- O resolvedor central associa a arte pelo ID exato e preserva imagens próprias.
- É o estágio atual do SoulForge.
- Previews essenciais podem permanecer no precache; banners de detalhe de classe usam cache sob demanda mesmo no Estágio 1 para preservar uma instalação inicial enxuta.

### Estágio 2 — catálogo ilustrado

Torna-se obrigatório ao exceder qualquer gatilho: 40 artes, 10 MiB de artes públicas ou previsão de precache acima de 15 MiB.

- Criar miniatura e detalhe para cada arte.
- Carregar miniaturas de forma preguiçosa nas listas e carregar o detalhe somente quando o usuário abrir a entrada.
- Manter no precache a casca do aplicativo, fallbacks e, se o orçamento permitir, miniaturas essenciais.
- Retirar imagens de detalhe do precache global e usar cache de execução com limite de entradas e política de expiração.
- Manter um manifesto central com ID da Definition, caminhos, dimensões, tamanhos, origem e licença.
- Adicionar uma verificação automatizada de formato, dimensões, arquivos ausentes, duplicidade e orçamento ao `pnpm run check`.
- Informar claramente que uma arte ainda não visitada pode não estar disponível offline, sem afetar o conteúdo textual.

### Estágio 3 — biblioteca completa ou múltiplos Packs

Aplicável quando houver centenas de artes ou coleções independentes.

- Separar artes da casca pública do aplicativo.
- Distribuir pacotes visuais opcionais por Pack ou coleção, sem duplicar Definitions.
- Permitir baixar e remover um pacote visual explicitamente para uso offline.
- Guardar o estado de instalação e a versão do pacote visual separadamente do personagem.
- Atualizar apenas arquivos modificados e preservar o catálogo textual durante falhas ou falta de espaço.
- Mostrar tamanho antes do download e permitir uso sem arte.
- Definir política de quota e limpeza antes de implementar sincronização ou downloads automáticos.

## Manifesto futuro de artes

O Estágio 2 deve introduzir um manifesto legível por ferramentas, com pelo menos:

- ID estável da Definition;
- caminho da miniatura e do detalhe;
- largura, altura e tamanho de cada arquivo;
- tipo MIME;
- origem: original SoulForge, usuário ou Pack;
- licença ou autorização de distribuição;
- ferramenta e data de geração, quando aplicável;
- hash para detectar duplicatas e alterações.

O manifesto descreve apresentação. Ele não cria um novo conceito central no domínio e não deve ser persistido no Character.

## Fluxo obrigatório para novos lotes

1. Confirmar direitos de uso e registrar que a arte não é oficial quando for gerada pelo projeto.
2. Ler a Definition completa e elaborar uma composição coerente com seu efeito, sem copiar arte ou identidade visual oficial.
3. Gerar o mestre sem texto, logo, moldura ou marca d'água, salvo quando o próprio componente exigir texto original.
4. Criar os arquivos de entrega nas dimensões e limites desta política.
5. Associar pelo ID estável em um resolvedor central ou manifesto.
6. Preservar a prioridade da imagem fornecida pelo usuário ou Pack.
7. Conferir miniatura, detalhe, recorte responsivo, contraste e ausência de dependência visual.
8. Comparar o tamanho do build e do precache antes e depois.
9. Executar TypeScript, testes, arquitetura, build e `git diff --check`.
10. Atualizar a documentação do lote quando houver prompts, exceções ou uma nova direção artística.

## Baseline atual

Em 7 de setembro de 2026, o primeiro lote de cartas possui seis imagens JPEG de 960 × 960, entre aproximadamente 123 e 192 KB cada, totalizando cerca de 935 KB. O build completo reportou precache próximo de 2,7 MiB.

Esse lote está dentro do Estágio 1. As imagens JPEG podem ser convertidas para WebP junto da futura automação de assets; não é necessário criar uma migração isolada enquanto os limites permanecerem saudáveis.

Em 8 de setembro de 2026, as 13 classes dos Packs Core e Hope & Fear passaram a possuir preview quadrado e banner vertical finalizado: 26 arquivos WebP, totalizando 2.147.498 bytes. Os 13 previews integram o precache; os 13 banners usam cache de execução `CacheFirst`, com 16 entradas e expiração em 90 dias. O build contém 45 entradas e 3.106,75 KiB no precache. O projeto continua no Estágio 1 e o detalhe visitado permanece disponível offline.

O processo específico, os prompts, critérios de aprovação e regras de manutenção das classes estão registrados em [Artes de classe](CLASS_ARTWORK.md).

Em 14 de setembro de 2026, Oculto, Restringido e Vulnerável receberam três
artes quadradas JPEG de 960 × 960, totalizando 409.611 bytes. O precache do
build `0.28.0` passou a 3.576,92 KiB com 48 entradas, ainda dentro da faixa
saudável do Estágio 1. As composições foram verificadas também no recorte de
token de 48 px; a integração dos tokens permanece planejada separadamente.

Em 19 de setembro de 2026, corda e adaga genérica receberam duas artes WebP de
512 × 512, qualidade 82, totalizando 43.420 bytes. A vinculação usa IDs estáveis
e preserva imagens próprias. O build passou a 50 entradas e 3.651,07 KiB no
precache, ainda dentro da faixa saudável do Estágio 1. Os prompts e critérios
do lote estão registrados em [Artes genéricas de itens](ITEM_ARTWORK.md).

Em 17 de outubro de 2026, uma espada genérica WebP de 512 × 512, com 8.122
bytes, passou a representar somente as famílias convencionais de espada do Pack
Core quando não possuem arte própria. A associação também usa IDs estáveis e
exclui armas de silhueta específica. Após a integração, o build contém 58
entradas e 4.551,59 KiB no precache. Os prompts e critérios do lote estão em
[Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, um cajado genérico WebP de 512 × 512, com 6.376 bytes, passou a
representar somente as quatro famílias convencionais de bastões e cajados do Pack
Core, incluindo suas progressões. Itens nomeados e silhuetas específicas
permanecem sem fallback. Após a integração, o build contém 59 entradas e
4.558,72 KiB no precache. Os critérios do lote estão em
[Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, uma armadura metálica genérica WebP de 512 × 512, com 29.758
bytes, passou a representar apenas as famílias convencionais de cota de malha,
placas, brigantina, bandas e escamas, incluindo suas progressões. Armaduras
nomeadas, mágicas ou de silhueta particular permanecem sem fallback. Após a
integração, o build contém 60 entradas e 4.588,87 KiB no precache. Os critérios do
lote estão em [Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, um arco genérico WebP de 512 × 512, com 6.038 bytes, passou a
representar somente os arcos curtos, longos e o arco grande convencionais do Pack
Core, incluindo as progressões disponíveis. Arcos nomeados ou de silhueta
particular permanecem sem fallback. Após a integração, o build contém 61 entradas
e 4.595,27 KiB no precache. Os critérios do lote estão em
[Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, um escudo genérico WebP de 512 × 512, com 30.764 bytes, passou a
representar somente os escudos redondos e broquéis convencionais do Pack Core,
incluindo as progressões disponíveis. Escudos torre, mágicos ou de silhueta
particular permanecem sem fallback. Após a integração, o build contém 62 entradas
e 4.625,67 KiB no precache. Os critérios do lote estão em
[Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, uma arma de impacto genérica WebP de 512 × 512, com 11.432 bytes,
passou a representar somente maças e martelos de guerra convencionais do Pack
Core, incluindo as progressões. Mangual e armas nomeadas ou incomuns permanecem
sem fallback. Após a integração, o build contém 63 entradas e 4.637,30 KiB no
precache. Os critérios do lote estão em [Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, uma lança genérica WebP de 512 × 512, com 5.822 bytes, passou a
representar somente a Lança convencional do Pack Core, incluindo suas
progressões. Armas nomeadas, mágicas ou de silhueta particular permanecem sem
fallback. Após a integração, o build contém 64 entradas e 4.642,99 KiB no
precache. Os critérios do lote estão em [Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, um machado genérico WebP de 512 × 512, com 9.806 bytes, passou a
representar somente o Machado de Batalha convencional do Pack Core, incluindo
suas progressões. Machado Sagrado e armas nomeadas, mágicas ou de silhueta
particular permanecem sem fallback. Após a integração, o build contém 65
entradas e 4.653,14 KiB no precache. Os critérios do lote estão em
[Artes genéricas de itens](ITEM_ARTWORK.md).

Na mesma data, uma besta genérica WebP de 512 × 512, com 12.390 bytes, passou a
representar somente a Besta convencional do Pack Core, incluindo suas
progressões. Bestas nomeadas, mágicas ou de silhueta particular permanecem sem
fallback. Após a integração, o build contém 66 entradas e 4.665,50 KiB no
precache. Os critérios do lote estão em [Artes genéricas de itens](ITEM_ARTWORK.md).

Em 10 de outubro de 2026, os três grimórios de nível 1 do domínio Códice
receberam artes quadradas WebP de 960 × 960. Em 11 de outubro, Ava, Illiat e
Tyfar foram refeitos como trípticos horizontais, com uma magia por faixa; o lote
passou a totalizar 369.612 bytes. As composições mantêm o foco na área segura
para o recorte de miniatura. Após essa revisão, o build contém 56 entradas e
4.461,22 KiB no precache, ainda dentro da faixa saudável do Estágio 1. A direção
visual e os critérios do lote estão registrados em
[Artes de cartas](CARD_ARTWORK.md).

Na mesma data, as três cartas de nível 1 do domínio Esplendor receberam artes
quadradas WebP de 960 × 960, totalizando 396.142 bytes. A paleta marfim-dourada
identifica o domínio sem abandonar as sombras preto-ameixa da coleção. As
composições foram verificadas no recorte central 2:3 e permanecem abaixo da meta
de 150 KB por arquivo. A direção visual está registrada em
[Artes de cartas](CARD_ARTWORK.md).

Em 11 de outubro de 2026, Enganador Habilidoso e Cativar completaram as artes de
nível 1 do domínio Graça. As duas novas imagens WebP de 960 × 960 totalizam
125.352 bytes; com Palavras Inspiradoras, o trio ocupa 259.324 bytes. A paleta
vinho–ameixa e os efeitos rosa-violeta permanecem contidos para priorizar
expressões e linguagem corporal. Após a integração, o build contém 58 entradas
e 4.583,72 KiB no precache, ainda dentro da faixa saudável do Estágio 1. A
direção visual está registrada em [Artes de cartas](CARD_ARTWORK.md).

Em 17 de outubro de 2026, Sem Armadura, Empurrão Poderoso e Eu Sou Seu Escudo
completaram as artes de nível 1 do domínio Valor. As três imagens WebP de
960 × 960 totalizam 346.816 bytes e usam o mesmo guardião, iluminação prática
baixa e efeitos âmbar localizados para evitar poluição visual. Após a integração,
o build contém 69 entradas e 5.004,32 KiB no precache, ainda dentro da faixa
saudável do Estágio 1. A direção visual está registrada em
[Artes de cartas](CARD_ARTWORK.md).

Em 26 de outubro de 2026, Proteção Rúnica, Liberar Caos e Caminhar pelas
Paredes completaram as artes de nível 1 do domínio Arcano. As três imagens WebP
de 960 × 960 totalizam 303.822 bytes e usam violeta profundo apenas nos pontos
de efeito, com cenários de escala humana e ação única legível. As URLs recebem
versões explícitas para evitar que caches antigos ocultem uma arte aprovada.
Após a integração, o build contém 72 entradas e 5.315,06 KiB no precache,
ainda dentro da faixa saudável do Estágio 1. A direção visual está registrada
em [Artes de cartas](CARD_ARTWORK.md).

Em 26 de outubro de 2026, Levante-se, Não é Suficiente e Redemoinho completaram
as artes de nível 1 do domínio Lâmina. As três imagens WebP de 960 × 960
totalizam 297.674 bytes e mostram a mesma duelista com duas cimitarras, em
ações estritamente marciais dentro de uma taberna, com vermelho-terroso localizado
e sem efeitos sobrenaturais. As URLs recebem versões explícitas para atualizar
com segurança o cache de artes genéricas; imagens de Packs ou da pessoa usuária
seguem prioritárias. O resultado do build permaneceu com 75 entradas e passou a
5.605,99 KiB no precache, ainda dentro da faixa saudável do Estágio 1.

Em 27 de outubro de 2026, Golpe Maculador e Véu Umbrático completaram o nível 1
de Dread ao lado da arte existente de Voz do Pavor. As duas novas imagens WebP
de 960 × 960 totalizam 164.476 bytes e preservam a mesma conjuradora, a paleta
azul-preto e violeta contida e os cenários góticos de escala humana. As URLs
revisionadas atualizam o cache sem sobrepor imagens de Packs ou da pessoa usuária.
O build passou a 77 entradas e 5.789,24 KiB no precache, ainda dentro da faixa
saudável do Estágio 1.

Em 27 de outubro de 2026, Rastreador Talentoso, Língua da Natureza e Enredar
Feroz completaram o nível 1 de Sage. As três imagens WebP opacas de 960 × 960
totalizam 396.684 bytes e usam a mesma rastreadora adulta em cenas naturalistas:
rastreamento, diálogo com uma raposa e contenção física por raízes. O figurino
ritual aberto combina top de folhas e fibras com cobertura completa, faixas de
couro, adornos de osso e saia assimétrica de peles e franjas. Verde-musgo
permanece localizado em vegetação e seiva, sem brilho difuso, runas ou partículas.
As URLs revisionadas atualizam o cache sem substituir artes fornecidas por Packs
ou pela pessoa usuária. Após a integração, o build contém 80 entradas e 6.177,82
KiB no precache, ainda dentro da faixa saudável do Estágio 1.

Em 27 de outubro de 2026, seis artes fornecidas pela pessoa usuária foram
incorporadas após otimização: a nova versão de Redemoinho, os grimórios de Sitil
e Vagrás e três habilidades de Osso. Os WebPs opacos de 960 × 960 ocupam juntos
640.178 bytes; a substituição de Redemoinho preserva o arquivo estável e as cinco
demais entradas usam novos IDs exatos. As URLs revisionadas preservam prioridade
de imagem própria de Packs ou da pessoa usuária. Após a integração, o build contém
85 entradas e 6.720,93 KiB no precache, ainda dentro da faixa saudável do Estágio
1.

## Pendências planejadas

1. Criar o manifesto e o verificador automatizado antes de ultrapassar 40 artes.
2. Padronizar a geração de WebP e miniaturas em um script reproduzível.
3. Medir carregamento, memória e rolagem no iPad ao completar cada lote relevante.
4. Medir a taxa real de reutilização do cache sob demanda dos banners antes de ampliar artes para classes de Packs adicionais.
5. Projetar pacotes visuais opcionais somente quando a quantidade real justificar o Estágio 3.
