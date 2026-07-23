# Arquitetura do SoulForge

Versão: 1.0 (Rascunho)

---

# Objetivo

Este documento define os princípios arquiteturais do SoulForge.

Ele é intencionalmente independente de qualquer linguagem de programação, framework ou tecnologia de interface.

Seu objetivo é descrever **como o projeto está organizado**, **quais problemas ele pretende resolver** e **quais regras toda decisão futura deve respeitar**.

Sempre que uma decisão de implementação entrar em conflito com este documento, este documento prevalece.

---

# O que é o SoulForge?

SoulForge é um aplicativo de apoio (*Companion App*) para o RPG Daggerheart.

Seu objetivo é reduzir a quantidade de material físico necessário durante uma sessão, preservando a experiência tradicional de jogo de mesa.

O SoulForge **não é** um Virtual Tabletop (VTT).

Ele não substitui a experiência da mesa.

Ele a complementa.

---

# Filosofia da Arquitetura

A arquitetura é construída sobre uma ideia fundamental:

> Tudo o que o aplicativo conhece sobre Daggerheart deve vir de dados, e não de código, sempre que possível.

O aplicativo interpreta dados.

O aplicativo não deve conter conteúdo do jogo codificado diretamente.

---

# Princípios Arquiteturais

## 1. Software de Longa Vida

O projeto foi concebido para evoluir durante muitos anos.

Facilidade de manutenção deve sempre ser priorizada em relação à conveniência de curto prazo.

Toda decisão arquitetural deve favorecer simplicidade e estabilidade.

---

## 2. Daggerheart em Primeiro Lugar

O aplicativo existe para apoiar Daggerheart.

Generalizações só devem acontecer quando casos reais demonstrarem essa necessidade.

Evite abstrações criadas "por precaução".

---

## 3. Experiência em Tela Única

O aplicativo deve minimizar a navegação.

O jogador deve conseguir acessar as informações necessárias durante a sessão com o menor número possível de interações.

---

## 4. Conteúdo Orientado por Dados

O conteúdo do jogo pertence aos dados.

O aplicativo interpreta esses dados em vez de conter regras específicas do sistema.

As Definitions descrevem o jogo.

O aplicativo apenas as interpreta e apresenta.

---

## 5. Arquitetura Antes da Implementação

O domínio deve ser completamente compreendido antes do início da implementação.

A implementação valida a arquitetura.

A arquitetura não deve surgir como consequência da implementação.

---

## 6. Linguagem do Jogador

O modelo de domínio deve utilizar a mesma terminologia empregada pelos jogadores.

Sempre que existir um termo oficial do jogo, ele deve ser preferido a um termo técnico.

Exemplos:

- Classe
- Carta
- Domínio
- Característica
- Esperança
- Estresse
- Experiência

---

## 7. Conteúdo Baseado em Packs

Todo conteúdo do jogo pertence a um Pack.

Exemplos:

- Livro Básico
- Expansões Oficiais
- Coleções Homebrew

O aplicativo não diferencia conteúdo oficial de conteúdo personalizado.

Para a arquitetura, tudo é um Pack.

---

## 8. Documentação como Contrato

A documentação define a arquitetura.

O código a implementa.

Se código e documentação entrarem em conflito, a documentação deve ser revisada antes da implementação continuar.

---

## 9. Simplicidade do Domínio

Modele apenas conceitos que realmente existam no jogo.

Não introduza abstrações artificiais sem um benefício claro.

Quando dois conceitos representarem essencialmente a mesma coisa, prefira o modelo mais simples.

---

## 10. Identidade Estável das Definitions

Definitions são imutáveis.

Uma Definition sempre representa o mesmo conceito.

Cada Definition possui um identificador estável que nunca muda.

Os Characters referenciam Definitions apenas por ID.

---

## 11. Validação por Casos Reais

Novas abstrações só devem ser criadas quando resolverem um problema real.

Evite arquitetura especulativa.

Prefira uma pequena duplicação a uma abstração prematura.

---

## 12. Domínio Independente da Plataforma

O modelo de domínio deve permanecer independente da tecnologia utilizada na interface.

Toda informação persistida deve ser representável através de estruturas JSON simples.

O domínio nunca deve depender de código executável para existir.

---

# Regra Permanente de Validação

Toda nova proposta arquitetural deve responder às seguintes perguntas.

## Pergunta 1

Isso representa um conceito real de Daggerheart?

Se não representar, deve ser descartado.

---

## Pergunta 2

Esse conceito pode ser representado utilizando apenas JSON simples?

Se não puder, simplifique-o.

---

## Pergunta 3

O aplicativo consegue interpretar esse JSON sem incorporar regras específicas de Daggerheart?

Se não conseguir, significa que lógica do jogo está vazando para a implementação.

---

# Estrutura do Domínio

A arquitetura separa as informações em duas grandes categorias.

## Definitions

Definitions descrevem o jogo.

Exemplos:

- Classes
- Cartas
- Armas
- Armaduras
- Características
- Domínios
- Condições

Definitions são imutáveis.

Definitions não armazenam estado do jogador.

Definitions podem ser reutilizadas por qualquer Character.

---

## Characters

Characters representam o estado atual de um personagem.

Eles referenciam Definitions.

Characters nunca redefinem conteúdo do jogo.

---

# Dados Imutáveis e Dados Mutáveis

Uma das principais decisões arquiteturais é separar conteúdo permanente do estado da partida.

Exemplos de dados imutáveis:

- Cartas
- Classes
- Armas
- Domínios

Exemplos de dados mutáveis:

- Pontos de Vida (HP)
- Estresse
- Esperança
- Inventário
- Equipamentos
- Efeitos temporários

---

# Filosofia dos Behaviors

Behaviors são declarativos.

Definitions podem declarar Behaviors.

Definitions nunca executam Behaviors.

Characters interpretam esses Behaviors.

Essa abordagem mantém o domínio totalmente orientado por dados.

---

# Progression

Progression é um tipo especializado de Behavior.

Ela descreve o que acontece quando um personagem evolui.

Progression nunca modifica diretamente um Character.

Ela apenas declara eventos que posteriormente serão interpretados pelo Character.

---

# Dados Antes de Código

Sempre que possível, prefira representar conhecimento utilizando JSON em vez de regras implementadas em código.

O aplicativo deve compreender a estrutura dos dados, e não conhecer as mecânicas específicas do jogo.

---

# Funciona Sem Internet

A arquitetura assume que o aplicativo pode funcionar integralmente sem acesso à internet.

Nenhum serviço online deve ser necessário para uma sessão normal de jogo.

---

# Independência de Plataforma

O domínio é independente da plataforma utilizada.

Os mesmos dados devem funcionar, sem alterações, em:

- Windows
- Linux
- macOS
- Android
- iOS
- iPadOS

---

# Extensibilidade

A arquitetura foi projetada para suportar novas adições sem necessidade de modificar conteúdo existente.

Exemplos:

- Novas expansões oficiais
- Packs Homebrew
- Novas cartas
- Novas ancestrais
- Novas classes

Novos conteúdos devem ser adicionados por meio de dados, e não por alterações no código.

---

# Objetivos Fora do Escopo

O SoulForge não tem como objetivo:

- substituir a experiência do jogo de mesa;
- tornar-se um Virtual Tabletop (VTT);
- automatizar o RPG;
- implementar inteligência artificial para o jogo;
- substituir o Mestre.

Seu objetivo é auxiliar os jogadores.

---

# Princípio Orientador

Sempre que houver dúvida entre duas soluções, escolha aquela que for:

- mais simples;
- mais próxima da terminologia oficial de Daggerheart;
- representável utilizando JSON simples;
- independente da tecnologia de implementação;
- validada por casos reais de jogo.

Esses princípios sempre têm prioridade sobre conveniências de implementação.