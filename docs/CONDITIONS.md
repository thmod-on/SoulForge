# Condições

## Escopo

Condições são Definitions reutilizáveis do Compendium. Elas descrevem um
estado de jogo, mas não guardam quem está sob esse estado nem interpretam texto
livre para aplicar efeitos automaticamente.

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

## Limite desta entrega

Aplicar condições a personagens, preservar múltiplas origens e automatizar a
relação entre Estresse e Vulnerável pertence à pendência `CND-001`. Este capítulo
fornece as Definitions que esse estado referenciará, sem antecipar a persistência
na ficha.

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
