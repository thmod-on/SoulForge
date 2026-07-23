# SoulForge AI Development Context

Versão: 1.0 (Rascunho)

---

# Objetivo

Este documento fornece o contexto necessário para que agentes de IA contribuam com o desenvolvimento do SoulForge.

Seu objetivo é garantir que novas implementações respeitem a arquitetura, o modelo de domínio e os princípios estabelecidos pelo projeto.

Este documento complementa:

- ARCHITECTURE.md
- DOMAIN_MODEL.md
- DOMAIN_BEHAVIORS.md
- JSON_CONVENTIONS.md
- ADRs

Em caso de conflito, os documentos arquiteturais prevalecem.

---

# O que é o SoulForge

SoulForge é uma aplicação Offline Capable para gerenciamento de personagens de Daggerheart.

O projeto não é um Virtual Tabletop (VTT).

Seu foco é fornecer uma experiência rápida para criação, evolução e utilização de personagens durante as sessões.

---

# Objetivos do Projeto

Toda implementação deve priorizar:

- simplicidade;
- clareza;
- baixo acoplamento;
- reutilização;
- manutenção de longo prazo.

O objetivo nunca é implementar rapidamente.

O objetivo é construir uma base sólida para evolução contínua.

---

# Filosofia Arquitetural

A arquitetura do projeto é orientada por conteúdo.

As regras do jogo pertencem às Definitions.

A Engine apenas interpreta essas regras.

Sempre que possível:

- adicionar conteúdo;
- evitar adicionar código.

---

# Princípios

Toda implementação deve respeitar os princípios definidos em ARCHITECTURE.md.

Em especial:

- Domain Simplicity
- Content Driven
- Documentation as Contract
- Stable Definition Identity
- Platform Independent Domain
- Offline Capable

Nenhuma implementação deve violar esses princípios.

---

# Modelo do Domínio

Existem apenas três conceitos fundamentais.

- Pack
- Definition
- Character

Todo o restante deriva desses conceitos.

Não criar novos conceitos centrais sem uma decisão arquitetural explícita.

---

# Definitions

Definitions representam conteúdo permanente.

São:

- imutáveis;
- identificadas por IDs estáveis;
- pertencentes a um único Pack.

Definitions nunca armazenam estado de personagem.

---

# Character

Character representa apenas estado mutável.

Character referencia Definitions.

Character nunca copia conteúdo oficial.

---

# Behaviors

Behaviors representam regras declarativas.

Eles:

- não possuem código;
- não possuem lógica imperativa;
- não executam operações diretamente.

A Engine interpreta Behaviors.

---

# Progression

Progression é um uso especializado de Behaviors.

Não deve ser implementada como um sistema separado.

---

# JSON

JSON representa apenas serialização.

Não implementar lógica diretamente em arquivos JSON.

Os arquivos devem permanecer simples e legíveis.

---

# Engine

A Engine deve conhecer apenas Behaviors.

Ela nunca deve possuir conhecimento específico sobre:

- Classes;
- Cards;
- Weapons;
- Features;
- qualquer conteúdo oficial.

Todo conhecimento pertence às Definitions.

---

# Desenvolvimento

Ao implementar novas funcionalidades, seguir a seguinte ordem de decisão.

## Primeiro

Resolver utilizando conteúdo.

## Depois

Resolver reutilizando Behaviors existentes.

## Depois

Adicionar novos parâmetros.

## Somente então

Criar um novo Behavior.

## Apenas como último recurso

Modificar a Engine.

---

# Antes de implementar

Sempre responder às seguintes perguntas.

## Esta alteração modifica o domínio?

Se sim, atualizar a documentação.

---

## Existe um Behavior que já resolve esse problema?

Se sim, reutilizá-lo.

---

## Um parâmetro resolveria?

Preferir novos parâmetros a novos Behaviors.

---

## A mudança pertence ao domínio ou à Engine?

Nunca misturar responsabilidades.

---

# Durante a implementação

Preferir:

- código pequeno;
- classes coesas;
- baixo acoplamento;
- composição em vez de herança;
- nomes claros.

Evitar abstrações desnecessárias.

---

# Após implementar

Verificar:

- arquitetura preservada;
- documentação consistente;
- IDs estáveis;
- ausência de duplicação;
- ausência de conhecimento específico de Daggerheart na Engine.

---

# Quando atualizar um ADR

Criar ou atualizar um ADR sempre que houver decisões envolvendo:

- arquitetura;
- contratos internos;
- carregamento de Packs;
- execução de Behaviors;
- persistência;
- comunicação entre componentes.

Não utilizar ADRs para pequenas decisões de implementação.

---

# O que evitar

Nunca:

- duplicar Definitions;
- criar dependências circulares;
- codificar regras oficiais diretamente na Engine;
- modificar IDs existentes;
- misturar estado com conteúdo;
- adicionar complexidade sem necessidade.

---

# Processo de Trabalho

Sempre seguir esta ordem.

1. Compreender o problema.

2. Consultar a documentação existente.

3. Identificar se a alteração pertence ao domínio ou à Engine.

4. Atualizar a documentação quando necessário.

5. Implementar.

6. Validar.

---

# Papel da IA

O papel da IA não é apenas escrever código.

É preservar a arquitetura do SoulForge.

Sempre que identificar uma implementação que conflite com a documentação, a IA deve interromper a implementação e explicar o conflito antes de prosseguir.

A documentação é o contrato principal do projeto.

O código deve refletir esse contrato.

---

# Resumo

Ao contribuir com o SoulForge, siga sempre estes princípios:

- Preserve a simplicidade.
- Preserve a arquitetura.
- Preserve a separação entre domínio e Engine.
- Prefira conteúdo a código.
- Prefira reutilização a expansão da Engine.
- Consulte a documentação antes de implementar.
- Quando houver dúvida, preserve o contrato arquitetural.