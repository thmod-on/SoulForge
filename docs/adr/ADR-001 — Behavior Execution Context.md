# ADR-001 — Behavior Execution Context

**Status:** Accepted

**Data:** 2026-07-22

---

# Contexto

Behaviors são descrições declarativas de regras do domínio.

Eles não possuem conhecimento sobre a implementação da Engine nem acesso direto ao estado do jogo.

Para que um Behavior possa ser interpretado corretamente, a Engine precisa fornecer todas as informações necessárias durante sua execução.

Era necessário definir qual seria o contrato entre o domínio e a Engine.

---

# Decisão

Todo Behavior será executado dentro de um **Execution Context**.

O Execution Context representa o ambiente completo necessário para interpretar um Behavior.

O domínio conhece apenas a existência desse contexto.

Sua estrutura interna pertence exclusivamente à Engine.

Em outras palavras:

> O domínio declara comportamentos.
>
> A Engine fornece o contexto necessário para executá-los.

Essa separação mantém o domínio completamente independente da implementação.

---

# Princípios

O Execution Context deve seguir os seguintes princípios.

## Completo

Todo Behavior deve receber todas as informações necessárias através do contexto.

Behaviors nunca devem buscar informações diretamente em serviços externos, bancos de dados ou interfaces.

---

## Efêmero

O contexto existe apenas durante a execução.

Ele nunca é persistido.

---

## Imutável

Behaviors não modificam o contexto.

As alterações produzidas por um Behavior devem ocorrer exclusivamente através dos mecanismos definidos pela Engine.

---

## Independente da origem

O mesmo Behavior pode ser executado durante:

- criação de personagem;
- Progression;
- combate;
- descanso;
- exploração;
- qualquer outro fluxo do jogo.

O contexto abstrai essas diferenças.

---

## Extensível

Novas informações poderão ser adicionadas ao contexto futuramente sem alterar a linguagem dos Behaviors.

---

# Informações Conceituais

Embora sua implementação pertença à Engine, espera-se que um Execution Context disponibilize informações equivalentes a:

- Character em execução;
- Definition de origem;
- alvo(s);
- estado atual do jogo;
- parâmetros do Behavior;
- serviços disponibilizados pela Engine.

Esses elementos representam conceitos.

Não representam classes, interfaces ou estruturas específicas.

---

# Responsabilidades da Engine

A Engine é responsável por:

- construir o contexto;
- validar o contexto;
- disponibilizar o contexto aos Behaviors;
- aplicar as alterações produzidas pelos Behaviors;
- controlar a ordem de execução.

---

# Responsabilidades do Domínio

O domínio é responsável apenas por:

- declarar Behaviors;
- declarar parâmetros;
- descrever intenções.

O domínio nunca constrói um Execution Context.

---

# Consequências

## Positivas

- O domínio permanece independente da implementação.
- Behaviors tornam-se totalmente reutilizáveis.
- A Engine pode evoluir sem alterar as Definitions.
- Novos fluxos do jogo reutilizam os mesmos Behaviors.
- Testes tornam-se mais simples, pois basta construir um contexto de execução.

## Negativas

- A Engine assume maior responsabilidade.
- O contrato do Execution Context torna-se parte importante da arquitetura interna.

---

# Alternativas Consideradas

## Behaviors acessarem diretamente o Character

Rejeitada.

Criaria forte acoplamento entre domínio e implementação.

---

## Behaviors acessarem serviços globais

Rejeitada.

Introduziria dependências implícitas e dificultaria testes.

---

## Cada Behavior definir seu próprio contexto

Rejeitada.

Produziria contratos inconsistentes e aumentaria significativamente a complexidade da Engine.

---

# Resultado

Todo Behavior é interpretado exclusivamente através de um Execution Context fornecido pela Engine.

O domínio permanece declarativo.

A Engine permanece responsável pela execução.

Essa decisão estabelece uma separação clara entre **o que o jogo descreve** e **como o sistema executa essa descrição**.