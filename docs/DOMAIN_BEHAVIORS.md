# Domain Behaviors

Versão: 1.0 (Rascunho)

---

# Objetivo

Este documento define a linguagem comportamental utilizada pelo SoulForge.

Enquanto o `DOMAIN_MODEL.md` descreve os conceitos existentes no domínio, este documento descreve como esses conceitos expressam comportamento.

O objetivo é definir:

- o que é um Behavior;
- como Behaviors são declarados;
- quais propriedades eles possuem;
- como a Engine os interpreta;
- quais Behaviors fazem parte da linguagem do domínio.

Este documento não descreve detalhes de implementação da Engine.

---

# Filosofia

O SoulForge segue uma arquitetura orientada por conteúdo (*Content Driven Architecture*).

As regras do jogo não são codificadas diretamente na Engine.

Elas são descritas pelas próprias Definitions através de Behaviors.

A Engine possui apenas um papel:

> Interpretar Behaviors declarados pelo domínio.

Isso significa que a Engine não conhece cartas específicas, classes específicas ou equipamentos específicos.

Ela conhece apenas a linguagem dos Behaviors.

---

# O que é um Behavior?

Behavior representa uma regra declarativa do domínio.

Ele descreve uma intenção.

Nunca descreve uma implementação.

Behavior não é código.

Behavior não é um método.

Behavior não é uma função.

Behavior não é um script.

Behavior é apenas uma descrição do comportamento esperado.

Por exemplo:

- causar dano;
- recuperar Hope;
- aplicar uma Condition;
- conceder uma Feature;
- realizar uma escolha durante a Progression.

Todas essas ações são descritas pelo domínio.

A Engine apenas interpreta essa descrição.

---

# Princípios

Todo Behavior segue os mesmos princípios.

## Declarativo

Descreve uma intenção.

Nunca uma implementação.

---

## Independente

Não conhece Classes.

Não conhece Cartas.

Não conhece Equipamentos.

Recebe apenas um contexto de execução.

---

## Reutilizável

Pode ser utilizado por qualquer Definition.

---

## Parametrizado

O comportamento permanece o mesmo.

Apenas seus parâmetros variam.

---

## Determinístico

Para um mesmo contexto e mesmos parâmetros, o resultado deve ser sempre o mesmo.

---

## Independente da Engine

O domínio descreve Behaviors.

A Engine decide como executá-los.

---

# Estrutura Conceitual

Todo Behavior possui quatro elementos conceituais.

## Identificador

Define qual comportamento será executado.

Exemplo:

- DealDamage
- Heal
- GrantHope

---

## Parâmetros

Informações necessárias para a execução.

Cada Behavior define seus próprios parâmetros.

---

## Contexto

Todo Behavior depende de um contexto de execução.

O contexto normalmente inclui:

- Character;
- Definition de origem;
- alvo;
- estado atual do jogo.

O formato desse contexto pertence à Engine.

---

## Resultado Esperado

Todo Behavior descreve uma mudança observável.

Essa mudança normalmente altera o Character State.

---

# Declaração

Behaviors são declarados por Definitions.

Exemplo conceitual:

Definition

↓

Behaviors

↓

Engine

↓

Character State

A Definition nunca executa o Behavior.

Ela apenas o declara.

---

# Progression

Progression é um uso especializado de Behaviors.

Seu objetivo é descrever como um Character evolui.

Ela não representa um sistema separado.

Continua sendo parte da mesma linguagem comportamental.

Exemplos:

- Grant
- Choice

---

# Catálogo de Behaviors

A linguagem do SoulForge possui um conjunto conhecido de Behaviors.

Novos Behaviors devem ser adicionados somente quando um novo conceito do domínio não puder ser representado pelos existentes.

## Progression

- Grant
- Choice

---

## Character State

- DealDamage
- Heal
- GrantHope
- SpendHope
- GrantStress
- RemoveStress

---

## Conditions

- ApplyCondition
- RemoveCondition

---

## Cards

- DrawCard
- DiscardCard
- MoveCard

---

## Inventory

- GrantItem
- RemoveItem
- EquipItem
- UnequipItem

---

## Character

- GrantFeature
- RemoveFeature
- GrantExperience

---

# Criando novos Behaviors

Antes de adicionar um novo Behavior, responda às seguintes perguntas.

1. Um Behavior existente resolve o problema?

2. Um novo parâmetro resolveria o problema?

3. O comportamento representa um novo conceito do domínio?

Somente quando todas as respostas anteriores forem negativas um novo Behavior deve ser criado.

Esse princípio mantém a linguagem pequena e estável.

---

# Evolução da Linguagem

Behaviors fazem parte do contrato público do domínio.

Depois de publicados, devem permanecer estáveis.

Mudanças incompatíveis devem resultar em novos Behaviors, e não na alteração do comportamento dos existentes.

---

# Princípios Arquiteturais

Toda linguagem comportamental do SoulForge respeita os seguintes princípios.

- Behavior pertence ao domínio.
- Behavior é declarativo.
- Behavior nunca contém código.
- Definitions declaram Behaviors.
- A Engine interpreta Behaviors.
- Apenas o Character State pode ser alterado.
- O domínio permanece independente da implementação.
- O conteúdo oficial é responsável por descrever regras.
- A Engine é responsável apenas por executá-las.

---

# Glossário

## Behavior

Descrição declarativa de uma regra do domínio.

---

## Context

Informações fornecidas pela Engine para execução de um Behavior.

---

## Parameter

Informação utilizada por um Behavior durante sua execução.

---

## Engine

Responsável por interpretar Behaviors.

---

## Progression

Conjunto especializado de Behaviors utilizado durante a evolução de um Character.

---

# Resumo

A linguagem comportamental do SoulForge baseia-se em um único conceito: **Behavior**.

Definitions descrevem comportamentos.

A Engine interpreta esses comportamentos.

Characters armazenam apenas o resultado da execução.

Essa separação mantém o domínio simples, reutilizável e independente de qualquer tecnologia específica.