# Packs

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
