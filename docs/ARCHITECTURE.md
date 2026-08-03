# Arquitetura do SoulForge

Versão: 1.0 (Rascunho)

---

# Organização da interface

A interface é modular por responsabilidade, mesmo sendo uma PWA sem framework:

- `src/app/`: tipos compartilhados, navegação e composição geral da aplicação;
- `src/features/`: telas e fluxos por área de produto, como Configurações, Compendium, Inventário e Progressão;
- `src/features/settings/`: renderização de Configurações e administração visual de dados locais;
- `src/features/compendium/`: regras de apresentação e futuras telas do catálogo;
- `src/domain/`: tipos e regras do domínio de jogo;
- `src/storage/`: acesso ao IndexedDB e persistência local.

`main.ts` deve atuar como orquestrador: inicializa dependências, mantém o estado transitório e conecta renderização a eventos. Novas telas não devem concentrar sua implementação completa nele.

No InventÃ¡rio, `src/features/inventory/renderInventory.ts` concentra a renderizaÃ§Ã£o das grades, itens e modais. As alteraÃ§Ãµes de inventÃ¡rio, a persistÃªncia e o drag-and-drop continuam no orquestrador, onde o estado da ficha Ã© atualizado.

As regras estÃ¡veis de ProgressÃ£o — tiers, custos, nomes e limites de escolha — ficam em `src/features/progression/progressionRules.ts`. A aplicaÃ§Ã£o de uma evoluÃ§Ã£o continua associada Ã  persistÃªncia da ficha.

AnotaÃ§Ãµes possui sua renderizaÃ§Ã£o em `src/features/notes/renderNotes.ts`; os fluxos de salvar, editar e excluir seguem no orquestrador para centralizar a atualizaÃ§Ã£o local da ficha.

Os modais de ProgressÃ£o sÃ£o renderizados por `src/features/progression/renderProgressionDialogs.ts`; o orquestrador conserva as validaÃ§Ãµes e a gravaÃ§Ã£o da evoluÃ§Ã£o.

O espaÃ§o de escolhas da ProgressÃ£o fica em `src/features/progression/renderProgressionWorkspace.ts`, separado das regras que aplicam a evoluÃ§Ã£o ao personagem.

As aÃ§Ãµes de InventÃ¡rio ficam em `src/features/inventory/inventoryActions.ts`; elas atualizam dados e persistem a ficha, enquanto o drag-and-drop permanece como integraÃ§Ã£o de eventos no orquestrador.

O drag-and-drop do InventÃ¡rio usa `src/features/inventory/bindInventoryDrag.ts`, encapsulando Pointer Events, feedback visual e validaÃ§Ã£o do destino antes de solicitar a movimentaÃ§Ã£o do item.

A moldura da ficha do jogador — sidebar, navegaÃ§Ã£o, cabeÃ§alho de editor e recursos — Ã© renderizada por `src/features/player/renderPlayerShell.ts`.

A VisÃ£o Geral, a trilha de subclasse e o Vault ficam em `src/features/player/renderPlayerOverview.ts`, preservando no orquestrador apenas a origem dos dados e os eventos das cartas.

DomÃ­nios do Compendium sÃ£o encapsulados em `src/features/compendium/domains.ts`, reunindo gerenciamento, modais e persistÃªncia do CRUD dessa entidade.

Cartas do Compendium estÃ£o em `src/features/compendium/cards.ts`, incluindo filtros, detalhes, imagem, formulÃ¡rio, validaÃ§Ãµes e o CRUD local. A ativaÃ§Ã£o entre Vault e Loadout permanece na ficha do jogador.

Itens do Compendium ficam em `src/features/compendium/items.ts`, incluindo busca, categorias, imagens, prÃ©via, validaÃ§Ãµes e CRUD local sem permitir exclusÃ£o de um item ainda usado pela ficha.

Classes do Compendium estÃ£o em `src/features/compendium/classes.ts`, incluindo subclasses, features, imagem, visualizaÃ§Ã£o detalhada e o CRUD que persiste todas as Definitions relacionadas.

Ancestralidades do Compendium ficam em `src/features/compendium/ancestries.ts`, reunindo busca, Top/Bottom Features, imagem e o CRUD local que persiste as trÃªs Definitions relacionadas.

# Padrao obrigatorio para novas features

Toda funcionalidade nova deve ser criada em `src/features/<area>/` e agrupada por responsabilidade de produto.

- Renderizacao e modais ficam junto da feature.
- Acoes e validacoes especificas ficam junto da feature quando nao forem compartilhadas.
- Tipos e regras de Daggerheart ficam em `src/domain/`.
- Persistencia local fica em `src/storage/`.
- `src/main.ts` coordena estado transitório, eventos globais, inicializacao e composicao das features; nao deve voltar a concentrar uma tela ou CRUD completo.
- Cada nova feature deve documentar sua fronteira arquitetural e passar por `pnpm run build` e `pnpm run test` antes de uma release.

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
