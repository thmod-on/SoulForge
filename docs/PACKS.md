# Packs

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

## Ciclo de vida

Um Pack pode ser instalado, atualizado ou removido. A administração de Packs pertence a Configurações; o Compendium consulta o conteúdo disponibilizado por eles.

Remover um Pack não deve alterar silenciosamente um personagem. Caso alguma referência deixe de estar disponível, a aplicação deve informar a situação e aplicar uma regra explícita de compatibilidade.

## Validação antes de instalar ou publicar

- validar sintaxe JSON;
- validar IDs únicos dentro do catálogo;
- validar referências entre Definitions;
- conferir compatibilidade com a versão do modelo de domínio;
- construir e testar o aplicativo com o Pack carregado.
