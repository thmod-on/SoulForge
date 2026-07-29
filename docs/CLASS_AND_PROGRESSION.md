# Classes e progressão de Daggerheart

## Objetivo

Este documento transforma as regras de criação de classe e progressão do Daggerheart Core em um contrato de implementação para o SoulForge.

Ele descreve padrões confirmados do SRD oficial, sem reproduzir o livro-base. Conteúdo específico — textos completos de cartas, características e opções — pertence aos Packs.

## Fontes de regra

- [Daggerheart SRD 1.0 — setembro de 2025](https://www.daggerheart.com/wp-content/uploads/2025/09/Daggerheart-SRD-9-09-25.pdf): criação de personagem, classes, Evasão, progressão e multiclasses.
- [Character Sheets and Guides — maio de 2025](https://www.daggerheart.com/wp-content/uploads/2025/05/Character-Sheets-and-Guides-Daggerheart-May212025.pdf): representação visual dos tiers e avanços.

Quando houver atualização oficial, este documento deve ser revisado antes de mudar validações ou dados de Packs.

## Padrões das classes do Core

Todas as nove classes do Core seguem a mesma estrutura:

- concedem acesso a exatamente dois Domínios;
- definem Evasão e HP iniciais;
- oferecem itens iniciais;
- possuem uma ou mais características de classe;
- possuem uma Característica de Esperança, ativada ao gastar 3 Esperanças;
- são divididas em duas subclasses;
- cada subclasse começa com uma carta de Fundação e pode evoluir para Especialização e Maestria.

As classes do Core e seus valores iniciais são:

| Classe | Domínios | Evasão base | HP inicial |
| --- | --- | ---: | ---: |
| Bardo | Codex, Grace | 10 | 5 |
| Druida | Arcana, Sage | 10 | 6 |
| Guardião | Blade, Valor | 9 | 7 |
| Ranger | Bone, Sage | 12 | 6 |
| Ladino | Grace, Midnight | 12 | 6 |
| Seraph | Splendor, Valor | 9 | 7 |
| Feiticeiro | Arcana, Midnight | 10 | 6 |
| Guerreiro | Blade, Bone | 11 | 6 |
| Mago | Codex, Splendor | 11 | 5 |

### Padrões observados

- Guardião e Seraph iniciam com a menor Evasão e o maior HP; Ranger e Ladino seguem o extremo oposto de Evasão, com HP intermediário.
- Bardo e Mago possuem o menor HP inicial, mas não compartilham a mesma Evasão.
- Druida e Feiticeiro compartilham os mesmos valores iniciais, mas possuem Domínios e características distintos.
- Não há fórmula universal que permita inferir Evasão ou HP a partir de uma categoria da classe. Esses valores devem ser declarados por classe.
- A estrutura é comum, mas características de classe podem escalar por nível, por tier ou por recursos próprios. Exemplos do Core incluem dados que melhoram no nível 5 e efeitos cujo bônus acompanha o tier ou o nível.

Consequentemente, o SoulForge não deve codificar crescimento específico de uma classe na tela de Progressão. Esse comportamento deve vir das Definitions de classe, subclasse, carta ou feature.

## Evasão

Evasão representa a dificuldade de evitar ataques e efeitos indesejados. A Evasão base é determinada pela classe.

Para preservar a origem de cada modificador, o modelo deve separar:

```text
evasionAtual = evasionBaseDaClasse
             + bonusPermanenteDeProgressao
             + bonusPermanenteDeFeatures
             + modificadoresTemporariosAtivos
```

- `evasionBaseDaClasse`: valor inicial declarado na Definition da classe;
- `bonusPermanenteDeProgressao`: soma dos avanços de `+1 Evasão` escolhidos;
- `bonusPermanenteDeFeatures`: bônus permanentes explicitamente concedidos por conteúdo;
- `modificadoresTemporariosAtivos`: efeitos de cartas, equipamentos, condições ou características enquanto estiverem ativos.

O valor exibido na ficha pode ser calculado, mas a origem de cada camada deve permanecer rastreável. A Evasão base não deve ser alterada ao subir de nível; o avanço de Evasão adiciona um bônus permanente de `+1`.

## Outros valores iniciais e derivados

Na criação de personagem, além dos valores definidos pela classe:

- todos os personagens começam no nível 1;
- Proficiência inicial é 1;
- todos começam com 2 Esperanças;
- todos começam com 6 espaços de Stress;
- os modificadores de atributos são definidos na criação do personagem, não pela classe;
- o personagem recebe duas cartas de Domínio de nível 1 dentre os Domínios da sua classe;
- os limiares de dano são calculados a partir da armadura equipada: limiar base da armadura + nível do personagem;
- a Pontuação de Armadura vem da armadura equipada, somada a bônus permanentes aplicáveis.

HP inicial depende da classe. HP e Stress podem receber espaços adicionais por avanços, características e efeitos, respeitando o máximo de 12 espaços indicado pelo SRD.

## Contrato de dados para uma nova classe

Uma classe criada em um Pack deve ser capaz de declarar, no mínimo:

```ts
interface ClassDefinition {
  id: string;
  type: "class";
  name: string;
  description?: string;
  domainIds: [string, string];
  startingEvasion: number;
  startingHitPoints: number;
  startingItemChoices?: StartingItemChoice[];
  featureIds: string[];
  hopeFeatureId: string;
  subclassIds: [string, string];
  progressionEffects?: ProgressionEffect[];
}

interface SubclassDefinition {
  id: string;
  type: "subclass";
  classId: string;
  name: string;
  spellcastTrait?: TraitId;
  foundationFeatureIds: string[];
  specializationFeatureIds: string[];
  masteryFeatureIds: string[];
}
```

As interfaces acima são contrato de produto, não uma exigência de implementação imediata. Os tipos reais devem ser introduzidos no domínio quando o CRUD de Classes for implementado.

Regras de validação:

- os dois `domainIds` devem existir e ser distintos;
- a classe deve referenciar exatamente duas subclasses próprias;
- cada subclasse deve referenciar sua classe pai;
- `startingEvasion` e `startingHitPoints` são obrigatórios;
- `hopeFeatureId` deve apontar para uma feature com custo de 3 Esperanças, quando estiver seguindo a regra do Core;
- IDs de conteúdo são estáveis e relações usam IDs, nunca nomes exibidos.

## Estrutura universal de progressão

O Daggerheart possui 10 níveis divididos em quatro tiers:

| Tier | Níveis |
| --- | --- |
| 1 | 1 |
| 2 | 2–4 |
| 3 | 5–7 |
| 4 | 8–10 |

O grupo sobe de nível em conjunto quando o GM define que a mesa alcançou um marco narrativo. A cada subida, a ordem de resolução é:

1. aplicar a conquista de tier, se o novo nível for 2, 5 ou 8;
2. escolher dois avanços elegíveis do tier atual ou de tiers anteriores;
3. aumentar todos os limiares de dano em 1;
4. adquirir uma carta de Domínio elegível ou trocar uma carta anteriormente adquirida por outra dentro do limite permitido.

### Conquistas de tier

| Novo nível | Conquista |
| --- | --- |
| 2 | nova Experiência em `+2`; Proficiência permanente `+1` |
| 5 | nova Experiência em `+2`; Proficiência permanente `+1`; limpar marcações de atributos |
| 8 | nova Experiência em `+2`; Proficiência permanente `+1`; limpar marcações de atributos |

### Avanços

Cada subida concede duas escolhas de avanço. A disponibilidade precisa ser orientada por dados de tier, pois a ficha possui espaços marcáveis e algumas opções custam as duas escolhas da subida.

Avanços universais do Core:

- aumentar `+1` em dois atributos ainda não marcados no tier e marcá-los;
- adicionar um espaço permanente de HP;
- adicionar um espaço permanente de Stress;
- adicionar `+1` permanente a duas Experiências;
- receber uma carta adicional de Domínio;
- adicionar `+1` permanente de Evasão;
- receber a próxima carta da subclasse: Especialização ou Maestria;
- aumentar Proficiência em 1, consumindo as duas escolhas exigidas;
- fazer multiclasse a partir do nível 5, consumindo as duas escolhas exigidas.

Escolher uma carta aprimorada de subclasse impede a multiclasse daquele tier. Escolher multiclasse impede a opção de subclasse daquele tier e as demais opções de multiclasse da ficha.

As marcações de atributos impedem que os mesmos atributos sejam escolhidos novamente até serem limpas por uma conquista de tier. O SoulForge deve guardar essas marcações por atributo e por tier, e não apenas um booleano global sem contexto.

### Cartas de Domínio durante a progressão

No passo obrigatório de cartas, o personagem adquire uma carta de nível igual ou inferior ao seu nível, de um Domínio da classe. A carta pode entrar no Loadout ou Vault; se o Loadout já tiver cinco cartas, é necessário mover uma carta para o Vault.

O avanço opcional de carta adicional segue a mesma lógica. Se o personagem tiver multiclasse, pode escolher uma carta do Domínio da multiclasse até metade do nível atual, arredondada para cima.

## Multiclasse

A partir do nível 5, multiclasse é um avanço opcional de custo dois. Ao escolhê-la, o personagem:

1. seleciona uma classe adicional;
2. seleciona um dos Domínios dela;
3. recebe a característica de classe correspondente;
4. seleciona uma subclasse dessa nova classe e recebe sua carta de Fundação;
5. escolhe o atributo de Spellcast aplicável se as Fundações divergirem.

O modelo deve registrar a classe principal separadamente das classes de multiclasse e guardar o Domínio de multiclasse escolhido. A Evasão base e o HP inicial continuam sendo os da classe principal; multiclasse não substitui esses valores.

## Implicações para implementação

### Criação de personagem

O fluxo de criação precisa ser orientado pelos dados da classe:

1. selecionar classe;
2. aplicar Evasão e HP iniciais;
3. apresentar os dois Domínios da classe;
4. selecionar subclasse e conceder suas features de Fundação;
5. disponibilizar os itens iniciais e cartas de Domínio elegíveis;
6. registrar features de classe, Característica de Esperança e escolhas do jogador.

### Tela de Progressão

A tela deve apresentar:

- nível atual, tier e próximo marco;
- avanços elegíveis, seus custos e espaços ainda disponíveis;
- atributos marcados no tier atual;
- efeitos obrigatórios pendentes da subida;
- cartas e subclasses elegíveis a partir da classe do personagem;
- histórico imutável das escolhas concluídas.

O primeiro recorte pode continuar como planejamento visual. A automação só deve ser ativada quando Classes, Subclasses, Features, Domínios e Cartas estiverem modelados como Definitions e puderem ser validados.

## Fora do escopo inicial

O SoulForge não deve tentar executar automaticamente, neste momento, textos livres de características ou cartas. O motor deve primeiro registrar escolhas e aplicar efeitos estruturados seguros, como bônus de Evasão, espaços de HP/Stress, Proficiência, atributos e acesso a cartas.

Efeitos específicos de classe, recurso próprio, duração, gatilho narrativo ou comportamento de combate devem ser introduzidos de forma declarativa por Features e Behaviors, conforme `DOMAIN_BEHAVIORS.md`.
