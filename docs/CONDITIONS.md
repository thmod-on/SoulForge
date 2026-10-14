# Condições

## Escopo

Condições são Definitions reutilizáveis do Compendium. A Definition descreve a
regra; a ficha guarda separadamente quais Condições estão ativas e as origens
que ainda as mantêm em vigor.

O capítulo do Compendium permite pesquisar conteúdo importado, consultar sua
fonte e criar, editar ou excluir condições locais. Quando nenhum Pack fornece
condições, a interface preserva o capítulo e orienta a importação ou a criação
local.

## Contrato

`ConditionDefinition` acrescenta aos campos comuns de uma Definition:

- `category`: `standard` para condições padrão ou `special` para condições
  cujo efeito define seu próprio encerramento;
- `effect`: consequência mecânica da condição;
- `clearing`: orientação explícita para encerrar a condição;
- `image`: arte opcional;
- `rulesNotes`: lembretes adicionais opcionais.

O conteúdo oficial permanece em Packs locais privados, conforme
[Packs](PACKS.md) e [Política de conteúdo](CONTENT_POLICY.md). O arquivo pronto
para importação é `local-packs/imports/daggerheart-core-conditions.soulforge-pack.json`.

## Condições padrão

O Pack local do Core registra **Oculto**, **Restringido** e **Vulnerável**. O
detalhe de Vulnerável também lembra que marcar o último espaço de Estresse deixa
a personagem Vulnerável e que limpar ao menos 1 Estresse encerra essa origem da
Condição.

## Condições na ficha

A faixa **Estados em cena**, no topo da ficha, agrupa Condições e efeitos de
habilidade sem misturá-los. Cada Condição usa uma única referência visual, mesmo
quando possui mais de uma origem. O detalhe mostra o efeito completo, a forma de
encerramento e as origens ativas.

Uma pessoa pode adicionar uma Condição da cena e, opcionalmente, registrar sua
origem narrativa — por exemplo, o ataque de uma criatura. Essa origem é removida
manualmente. A origem automática `stress` de Vulnerável é independente: ela é
adicionada ao marcar o último espaço de Estresse e termina somente ao limpar ao
menos um espaço. Referências continuam na ficha mesmo se o Pack de origem não
estiver instalado; nesse caso, o SoulForge usa o nome salvo e um placeholder.

## Artes preparadas

As três condições padrão possuem artes originais em
`public/assets/conditions/generic/`. O resolvedor de apresentação associa cada
imagem ao ID exato para uso na miniatura e no detalhe do Compendium, preservando
a prioridade de uma imagem fornecida pela própria Definition. Os futuros tokens
da ficha ainda não consomem essas artes.

| Definition | Arquivo | Símbolo visual |
| --- | --- | --- |
| `condition.core.hidden` | `hidden.jpg` | Figura encapuzada dissolvendo-se em sombras. |
| `condition.core.restrained` | `restrained.jpg` | Figura imobilizada por correntes e faixas espectrais. |
| `condition.core.vulnerable` | `vulnerable.jpg` | Aura protetora fraturada e atravessada por sombras. |

As imagens foram geradas com a ferramenta integrada de geração de imagens em
14 de setembro de 2026. Direção comum: pintura digital de fantasia sombria,
composição quadrada central, paleta preta, ameixa, violeta, marfim e carmesim;
sem texto, logo, moldura, marca d'água ou elementos oficiais. Cada composição foi
validada no arquivo de detalhe de 960 × 960 e em recorte real de token de 48 px.
A arte de Restringido foi revisada para manter braços, cotovelos, antebraços e
mãos reconhecíveis nesse recorte, sem perder a leitura das amarras.
