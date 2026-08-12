# Marcadores de jogo

## Objetivo

Marcadores de jogo sao controles dinamicos da ficha, como cargas, dados reservados ou trilhas temporarias. Eles sao declarados pelo conteudo e interpretados pela ficha; o SoulForge nao procura palavras em `summary`, `effect` ou qualquer texto livre para criar um marcador.

## Definicao x estado

- **Definicao:** metadado reutilizavel em uma `CardDefinition`, `FeatureDefinition` ou `ClassDefinition`, no campo opcional `gameMarkers`. Ela pertence ao pack e nao muda durante a sessao.
- **Estado:** dados variaveis em `Character.gameMarkers`. Inclui o valor atual de um contador ou os resultados individuais e o uso de cada dado. O estado pertence somente ao personagem.

Uma definicao sem `gameMarkers` continua identica para a ficha. Personagens antigos nao precisam de migracao manual: o campo de estado e opcional e e criado quando uma fonte declarativa fica ativa.

## Contrato para autores de packs

Cada marcador tem um `id` unico dentro de sua fonte e um `label`.

### Contador

```json
{
  "id": "ward-charges",
  "kind": "counter",
  "label": "Cargas da guarda",
  "initialValue": 3,
  "max": 3,
  "reset": "long-rest"
}
```

`max` e `reset` sao opcionais. Os valores aceitos para reinicializacao sao `session`, `short-rest` e `long-rest`.

Quando a quantidade do contador depende de uma regra declarada, use `quantity` no lugar de um valor numerico fixo. Ela determina tanto o maximo quanto a reposicao no evento de reinicializacao:

```json
{
  "id": "inspirational-words-uses",
  "kind": "counter",
  "label": "Palavras Inspiradoras",
  "quantity": { "kind": "attribute", "attributeId": "con" },
  "reset": "long-rest"
}
```

### Dados

```json
{
  "id": "prayer-dice",
  "kind": "dice",
  "label": "Dados de Oracao",
  "die": "d4",
  "quantity": { "kind": "spellcast-trait" },
  "reset": "session"
}
```

Inicialmente, o tipo de dado suportado e `d4`. A quantidade pode ser fixa (`{ "kind": "fixed", "value": 3 }`), ligada a um atributo (`{ "kind": "attribute", "attributeId": "con" }`) ou ao atributo de Conjuracao da subclasse (`spellcast-trait`). Nesse ultimo caso, a `SubclassDefinition` declara explicitamente `spellcastAttributeId`; nenhuma descricao textual e interpretada.

## Sincronizacao da ficha

`src/features/game-markers/gameMarkerSync.ts` encontra fontes ativas por IDs:

1. classe escolhida e suas caracteristicas de classe/Esperanca;
2. features de Fundacao, Especializacao e Maestria efetivamente adquiridas da subclasse;
3. cartas presentes em `deck.activeCardIds`.

Para cada definicao ativa, cria o estado inicial apenas se ele ainda nao existir. Enquanto a fonte continuar ativa, o estado e preservado. Quando a fonte deixa de estar ativa, o marcador deixa de aparecer, mas seu estado permanece em `Character.gameMarkers`. Essa retencao e a estrategia segura atual: reativar uma carta restaura seus dados de sessao em vez de apagar algo silenciosamente. Uma futura regra explicita de limpeza podera descartar estados obsoletos por acao consciente do jogador.

Na Visao Geral, contadores possuem controles `-` e `+`, respeitam os limites declarados e persistem imediatamente. Dados exibem cada unidade individualmente: o jogador registra manualmente um resultado de 1 a 4 e depois marca aquele dado como usado ou disponivel. Selecionar novamente o mesmo resultado limpa o dado. O botao `Nova sessao` aparece quando houver marcador com `reset: "session"`; os atalhos de descanso aplicam apenas a reinicializacao cujo valor de `reset` corresponda exatamente ao descanso escolhido.

## Complementos locais para cartas de packs

O conteudo de um pack permanece imutavel. Na tela de Cartas, uma carta de pack pode receber apenas um **complemento local de marcador**; nome, efeito, imagem e demais campos originais nao sao alterados e a carta nao pode ser excluida. Esse complemento fica no armazenamento local, associado ao ID da carta, e tem precedencia sobre um marcador oficial enquanto existir.

Metadados oficiais revisados manualmente ficam em `src/content/officialCardMarkers.ts`. Essa camada existe para corrigir ou enriquecer conteudo instalado sem usar reconhecimento de palavras em descricoes. Uma inclusao nessa lista exige revisao direta da regra publicada.
