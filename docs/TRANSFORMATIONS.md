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

O texto do Lobisomem segue a errata oficial de 25 de agosto de 2026: em Forma de Lobo, ao **rolar com Esperança**, a personagem deve marcar 1 Estresse.

## Modelo declarativo

Uma definição de transformação usa `type: "transformation"` e exige:

- `name` e `summary`;
- `benefit`;
- `drawback`;
- `narrativeQuestions` com uma ou mais perguntas;
- opcionalmente, `gameMarkers` quando a regra possuir um contador compatível com o modelo de marcadores.

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

## Estado atual da aplicação

Esta etapa cobre catálogo, importação de Pack e visualização no Compendium. A ficha ainda não permite escolher, equipar ou aplicar uma transformação. Quando essa etapa for implementada, deverá garantir o limite de uma transformação, a presença fora do limite normal do Loadout e os comportamentos específicos de cada regra.

## Fontes e revisão

Precedência adotada: errata oficial, SRD vigente e materiais finais oficiais. A revisão atual usa o [Daggerheart SRD 2.0](https://www.daggerheart.com/srd/) e a [errata de Hope & Fear de 25 de agosto de 2026](https://www.daggerheart.com/wp-content/uploads/2026/08/Daggerheart-Hope-and-Fear-08-25-2026.pdf).
