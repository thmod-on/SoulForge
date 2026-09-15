# Transformações

## O que são

Transformações são escolhas opcionais de identidade que representam uma mudança fundamental na forma como a personagem existe e se relaciona com o mundo. Podem surgir durante a campanha ou ser oferecidas pelo GM na criação de personagem.

Elas são diferentes de **Condições**: condições são efeitos situacionais e temporários de jogo; uma transformação é uma parte persistente da identidade da personagem, com impacto mecânico e narrativo.

Uma personagem pode ter **no máximo uma transformação**.

Quando recebida, uma transformação entra no Loadout como parte da herança da personagem e **não consome o limite de cartas**. Cada definição declara uma descrição narrativa resumida, um benefício, uma desvantagem e perguntas narrativas para ajudar a mesa a desenvolver a ficção.

## Conteúdo oficial disponível

O Pack local `Hope & Fear - Transformações` contém:

- Semideus;
- Fantasma;
- Reanimado;
- Metamorfo;
- Vampiro;
- Lobisomem.

Na versão local `1.1.0-local`, as seis entradas preservam as duas Features,
valores, alcances, custos, gatilhos, encerramentos e as seis perguntas narrativas
relevantes do SRD 2.0. As regras completas ficam nos campos `benefit`,
`drawback` e `rulesNotes`; o `summary` serve apenas como apresentação breve.

O texto do Lobisomem segue a errata oficial de 25 de agosto de 2026: em Forma de Lobo, ao **rolar com Esperança**, a personagem deve marcar 1 Estresse.

## Modelo declarativo

Uma definição de transformação usa `type: "transformation"` e exige:

- `name` e `summary`;
- `benefit`;
- `drawback`;
- `narrativeQuestions` com uma ou mais perguntas;
- opcionalmente, `gameMarkers` quando a regra possuir um contador compatível com o modelo de marcadores;
- opcionalmente, `choices` e `restActions` para escolhas estruturadas realizadas como movimentos de descanso.

Exemplo reduzido:

```json
{
  "id": "transformation.local.example",
  "type": "transformation",
  "packId": "local",
  "name": "Exemplo",
  "summary": "Uma mudança decisiva na identidade.",
  "benefit": "Descreva o ganho mecânico.",
  "drawback": "Descreva a contrapartida.",
  "narrativeQuestions": ["O que mudou em você?"]
}
```

## Aplicação ao personagem

O `Character` mantém no máximo uma referência em `identity.transformationId`.
Esse ID aponta para a `TransformationDefinition`; benefício, desvantagem e demais
textos nunca são copiados para a ficha.

Na Visão Geral, a transformação aparece em uma seção própria depois dos recursos
e marcadores e antes das cartas ativas. Ela é tratada como herança persistente,
não como uma carta: não integra `deck.activeCardIds`, não pode ir ao Vault e não
consome o limite de cinco cartas.

A ficha permite conceder, substituir e remover a transformação. A substituição
mantém apenas uma referência e a remoção desativa suas mecânicas. Estados de
marcadores já registrados permanecem persistidos, mas deixam de aparecer enquanto
a Definition não for a transformação ativa.

Escolhas declarativas ficam em `Character.definitionSelections`, agrupadas pelo
`sourceDefinitionId`. Uma escolha com `application: "reference"` registra e
apresenta a Definition selecionada sem conceder automaticamente seus marcadores,
modificadores ou ativações. Assim, conteúdo pode representar uma escolha útil
antes que toda a sua mecânica seja automatizável.

Se o Pack estiver ausente, o ID é preservado e a ficha sinaliza a Definition
indisponível. Nenhuma regra é inferida do nome ou dos textos armazenados.

## Automação atual

- `gameMarkers` declarados pela transformação são sincronizados e exibidos pelos
  mesmos interpretadores usados pelas demais Definitions;
- contadores podem declarar `eventChanges` incrementais. O Sangue do Vampiro usa
  `decrement` de 1 em `long-rest`, respeitando o mínimo zero. Esse contrato é
  genérico e pode ser reutilizado por qualquer fonte de marcador;
- o Metamorfo declara uma ação `any-rest` que escolhe uma ancestralidade e, de
  forma dependente, uma de suas Features. A escolha ocupa um movimento, aparece
  na ficha apenas como referência e só pode ser alterada no fluxo de descanso;
- “Mudar de forma” continua visível, porém explicativa e indisponível, quando a
  personagem não possui uma transformação que ofereça essa ação;
- Packs de transformação já instalados podem ser reimportados como atualização;
  suas Definitions são substituídas de forma transacional sem remover a
  transformação das fichas existentes;
- Packs de transformação já instalados podem ser reimportados como atualização;
  suas Definitions são substituídas de forma transacional sem remover a
  transformação das fichas existentes;
- `rulesNotes` permanecem lembretes explícitos;
- benefício e desvantagem são apresentados juntos, sem interpretação de texto livre;
- bônus e efeitos da Feature assumida não são aplicados automaticamente enquanto
  a escolha declarar `application: "reference"`.

## Fontes e revisão

Precedência adotada: errata oficial, SRD vigente e materiais finais oficiais. A
auditoria integral mais recente foi concluída em 14 de setembro de 2026, usando
as páginas 41–44 do [Daggerheart SRD 2.0](https://www.daggerheart.com/wp-content/uploads/2026/08/DH_SRD_2_2026_08_25.pdf)
e a [errata de Hope & Fear de 25 de agosto de 2026](https://www.daggerheart.com/wp-content/uploads/2026/08/Daggerheart-Hope-and-Fear-08-25-2026.pdf).
