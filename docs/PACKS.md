# Packs

## Padrão editorial de Packs

Todo Pack gerado pelo SoulForge deve seguir estas regras:

- o nome visível usa o formato `Origem - Foco`, por exemplo `Core - Ancestralidades` e `Hope & Fear - Domínios`;
- não incluir a palavra “Daggerheart” no nome visível do Pack;
- escrever manifestos, Definitions, resumos e instruções em português do Brasil;
- salvar arquivos JSON em UTF-8 e revisar caracteres especiais, acentos e pontuação antes de gerar o arquivo `.soulforge-pack.json`;
- preservar, entre parênteses, um nome original em inglês apenas quando ele for necessário para reconhecimento ou quando a tradução não for um nome próprio consolidado;
- manter a origem, licença e condição de distribuição nos metadados do manifesto, não no nome visível.

> Atualização de importação local: o SoulForge aceita um único arquivo JSON com extensão recomendada `.soulforge-pack.json`. O arquivo usa `format: "soulforge-pack-v1"` e contém `manifest` e `definitions`. Antes da instalação, a aplicação valida formato, manifesto, IDs repetidos e o vínculo de cada Definition ao `packId` do manifesto. Depois da confirmação, o Pack e suas Definitions são persistidos somente no IndexedDB deste navegador. A remoção exige confirmação e também remove as Definitions daquele Pack, podendo deixar referências indisponíveis em personagens existentes.

## Propósito

Packs são unidades versionadas de conteúdo declarativo. Eles fornecem Definitions reutilizáveis para o catálogo, como cartas, itens, classes, domínios, ancestralidades e comunidades.

Um Pack não contém personagens, campanhas nem estado de jogo.

## Estrutura

Cada Pack possui um manifesto e arquivos de conteúdo. O pacote demo é a referência inicial:

```text
packs/<pack-id>/
  manifest.json
  cards/
  domains/
  items/
  classes/
  ancestries/
  communities/
```

Pastas sem conteúdo não precisam existir. Cada arquivo JSON representa uma única Definition independente.

## Manifesto

O manifesto identifica o Pack e informa, no mínimo:

- `id`: identificador único e estável;
- `name`: nome apresentado ao usuário;
- `version`: versão do conteúdo;
- `description`: descrição curta do Pack.

O identificador de um Pack nunca deve ser reutilizado para outro conteúdo.

## Conteúdo

Os arquivos seguem as convenções descritas em [JSON_CONVENTIONS.md](JSON_CONVENTIONS.md). Em especial:

- propriedades usam `camelCase` em inglês;
- IDs são estáveis e independem do nome exibido;
- conteúdo é declarativo; regras específicas não devem ser codificadas na interface;
- relações entre Definitions usam IDs.

### Modificadores de ficha em Features

Features podem declarar `sheetModifiers` para efeitos mecânicos que o
SoulForge sabe calcular. Cada modificador é estruturado e validado na
importação; textos em `summary` nunca geram efeitos automáticos.

- `resource-max`: aumenta o máximo de um recurso (`resourceId` e `amount`);
- `defense`: altera uma defesa fixa (`field` e `amount`);
- `defense-per-proficiency`: altera Limiar menor ou maior proporcionalmente à
  Proficiência.

O estado variável — por exemplo, quantos espaços de Estresse estão marcados —
continua pertencendo ao personagem. O Pack declara somente a regra reutilizável.

### Itens oficiais

Um pack de itens pode declarar, além dos campos comuns, `weaponProfile` e `armorProfile`. Esses metadados registram os dados oficiais de arma e armadura sem depender da interpretação de descrições livres.

- `weaponProfile`: categoria primária ou secundária, atributo de ataque, alcance, dano, tipo de dano e carga em mãos;
- `armorProfile`: Pontos de Armadura e os dois limiares-base;
- `combatModifiers`: somente modificadores que o SoulForge aplica automaticamente enquanto o item estiver equipado.

O Core e *Hope & Fear* não recebem um peso universal nem uma capacidade geral de mochila no SoulForge. Por isso, seus itens oficiais usam `weight: 0`: o aplicativo não impõe limite de armas, poções ou itens similares. A carga em mãos das armas continua declarada em `weaponProfile.burden`; limites narrativos e de quantidade ficam a critério da mesa.

Quando um Pack acrescentar Classes, Subclasses, Features ou conteúdo de progressão, ele deve ser compatível com o ruleset ativo. As regras comuns do Core são definidas em [PROGRESSION_IMPLEMENTATION.md](PROGRESSION_IMPLEMENTATION.md); um Pack não deve sobrescrevê-las implicitamente.

## Ciclo de vida

Um Pack pode ser instalado, atualizado ou removido. A administração de Packs pertence a Configurações; o Compendium consulta o conteúdo disponibilizado por eles.

Remover um Pack não deve alterar silenciosamente um personagem. Caso alguma referência deixe de estar disponível, a aplicação deve informar a situação e aplicar uma regra explícita de compatibilidade.

## Validação antes de instalar ou publicar

- validar sintaxe JSON;
- validar IDs únicos dentro do catálogo;
- validar referências entre Definitions;
- conferir compatibilidade com a versão do modelo de domínio;
- construir e testar o aplicativo com o Pack carregado.

## Conteúdo oficial e Packs privados

Packs que reproduzem conteúdo do Daggerheart SRD ou outro material da Darrington Press devem seguir [CONTENT_POLICY.md](CONTENT_POLICY.md).

Em especial, um Pack oficial destinado exclusivamente ao uso privado deve ficar em `local-packs/`, fora do controle de versão e do build público. Ele nunca deve ser importado por `src/content/installedPacks.ts`, incluído em `packs/` ou enviado ao GitHub Pages sem uma revisão explícita da licença e autorização aplicável.
