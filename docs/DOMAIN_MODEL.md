# Modelo de Domínio do SoulForge

Versão: 1.0 (Rascunho)

---

# Objetivo

Este documento descreve o modelo de domínio do SoulForge.

Seu objetivo é definir os conceitos fundamentais que existem no sistema, suas responsabilidades e como eles se relacionam.

O modelo de domínio representa exclusivamente as regras do negócio.

Ele é completamente independente de:

- linguagem de programação;
- framework;
- banco de dados;
- interface gráfica;
- plataforma.

Toda implementação deve refletir este modelo.

---

# Filosofia do Modelo

O SoulForge foi projetado sobre uma separação simples entre dois tipos de informação:

- conteúdo permanente do jogo;
- estado mutável de um personagem.

Essa separação reduz duplicação, facilita a persistência e permite que o conteúdo oficial seja reutilizado por qualquer personagem.

Em outras palavras:

> O jogo existe independentemente dos personagens.

Os personagens apenas interagem com o jogo.

---

# Visão Geral

O domínio pode ser representado da seguinte forma:

```
                    Pack
                     │
                     │
             contém Definitions
                     │
      ┌──────────────┼──────────────┐
      │              │              │
    Class          Card         Weapon
      │
 Subclass
      │
    Feature
      │
      └──────────────┐
                     │
               Character
                     │
     ┌───────────────┼───────────────┐
     │               │               │
 Identity        Persona         State
                     │
             Inventory / Deck
```

O diagrama representa apenas as relações conceituais.

Ele não representa classes de implementação.

---

# Conceitos Fundamentais

O domínio é construído sobre apenas três conceitos fundamentais.

- Pack
- Definition
- Character

Todo o restante deriva desses conceitos.

---

# Pack

## Descrição

Pack representa uma coleção de conteúdo distribuída como uma unidade única.

Ele funciona como um contêiner lógico para Definitions.

Um Pack nunca representa uma campanha ou um personagem.

---

## Responsabilidade

Um Pack é responsável por:

- organizar conteúdo;
- identificar a origem desse conteúdo;
- permitir instalação ou remoção do conteúdo;
- disponibilizar Definitions para o sistema.

---

## Contém

Um Pack pode conter qualquer quantidade de Definitions.

Exemplos:

- Classes
- Subclasses
- Cartas
- Domínios
- Armas
- Armaduras
- Comunidades
- Ancestralidades
- Features
- Condições

---

## Não contém

Um Pack nunca contém:

- Characters;
- estado de jogo;
- campanhas;
- progresso de jogadores.

---

## Relações

Um Pack:

- contém diversas Definitions;
- pode depender de outros Packs;
- nunca referencia Characters.

---

## Ciclo de Vida

Um Pack nasce quando é instalado.

Pode ser atualizado.

Pode ser removido.

Sua remoção nunca altera o modelo de domínio; apenas torna indisponíveis as Definitions que ele fornece.

---

# Definition

## Descrição

Definition representa qualquer elemento permanente do universo de Daggerheart.

Ela não representa um tipo específico de conteúdo.

Ela representa uma ideia muito mais ampla:

> Tudo aquilo que existe independentemente de um personagem.

Isso inclui praticamente todo o conteúdo oficial do jogo.

---

## Exemplos

Uma Definition pode representar:

- uma Classe;
- uma Subclasse;
- uma Carta;
- uma Arma;
- uma Armadura;
- um Domínio;
- uma Comunidade;
- uma Ancestralidade;
- uma Feature;
- uma Condição.

Todas seguem exatamente o mesmo princípio.

---

## Responsabilidade

Uma Definition descreve:

- propriedades;
- requisitos;
- relacionamentos;
- comportamentos declarativos;
- progressões;
- referências para outras Definitions.

Ela nunca descreve um personagem específico.

---

## Contém

Uma Definition pode conter:

- identificador único;
- nome;
- descrição;
- metadados;
- referências;
- Behaviors;
- Progression.

---

## Não contém

Uma Definition nunca contém:

- HP;
- Hope;
- Stress;
- inventário;
- equipamentos do jogador;
- efeitos temporários;
- recursos consumidos;
- progresso individual.

Essas informações pertencem ao Character.

---

## Relações

Uma Definition:

- pertence exatamente a um Pack;
- pode referenciar outras Definitions;
- nunca referencia Characters.

---

## Ciclo de Vida

Definitions são imutáveis.

Uma nova versão de uma Definition representa uma nova versão daquele conteúdo.

Characters nunca modificam Definitions.

---

# Character

## Descrição

Character representa um personagem criado por um jogador.

Ele concentra todo o estado persistente daquele personagem.

Enquanto uma Definition representa o jogo, um Character representa uma história específica vivida dentro dele.

---

## Responsabilidade

Character é responsável por armazenar todas as informações exclusivas daquele personagem.

Ele não descreve o jogo.

Ele apenas registra como aquele personagem interage com o jogo.

---

## Contém

Um Character é composto pelos seguintes componentes:

- Identity
- Persona
- State
- Inventory
- Deck

Cada componente possui uma responsabilidade específica.

Esses componentes serão detalhados nas próximas seções deste documento.

---

## Não contém

Character nunca contém cópias do conteúdo oficial.

Sempre que possível, ele referencia Definitions.

Essa decisão evita duplicação de dados e garante consistência quando o conteúdo oficial evolui.

---

## Relações

Um Character:

- referencia diversas Definitions;
- possui exatamente uma Identity;
- possui exatamente uma Persona;
- possui exatamente um State;
- possui exatamente um Inventory;
- possui exatamente um Deck.

---

## Ciclo de Vida

Um Character nasce durante sua criação.

Ao longo da campanha:

- evolui;
- adquire equipamentos;
- altera seu estado;
- modifica seu Deck;
- registra novas Experiences.

Ao ser salvo, apenas seu estado é persistido.

As Definitions permanecem compartilhadas entre todos os personagens.

---

# Agregados do Domínio

O modelo possui apenas dois agregados principais.

## Pack

Raiz responsável por todo o conteúdo reutilizável do jogo.

## Character

Raiz responsável por todo o estado persistente de um personagem.

Esses agregados nunca dependem um do outro diretamente.

Characters utilizam Definitions através de referências.

Essa separação é uma das principais decisões arquiteturais do SoulForge.

---

# Componentes de Domínio

## Descrição

Um Character não armazena todas as suas informações diretamente.

Ele é composto por um conjunto de **Componentes de Domínio** (*Domain Components*), cada um responsável por uma parte específica do personagem.

Essa divisão reduz o acoplamento entre os dados, facilita a evolução do modelo e mantém responsabilidades claramente separadas.

Todos os Componentes de Domínio pertencem exclusivamente ao Character.

Eles não possuem identidade própria e nunca existem de forma independente.

---

## Componentes

Todo Character possui exatamente um de cada componente:

- Identity
- Persona
- State
- Inventory
- Deck

Cada componente possui uma responsabilidade única.

---

# Identity

## Descrição

Identity representa a identidade narrativa do personagem.

Ela contém informações utilizadas para identificação do personagem pelo jogador e pela interface.

Esses dados não possuem influência sobre as regras do jogo.

---

## Responsabilidade

Identity é responsável apenas por identificar o personagem.

---

## Contém

Exemplos de informações:

- nome;
- apelido;
- retrato;
- descrição;
- jogador responsável;
- notas.

---

## Não contém

Identity nunca contém:

- atributos;
- equipamentos;
- recursos;
- cartas;
- regras.

---

## Relações

Identity pertence exclusivamente a um Character.

---

## Ciclo de Vida

Normalmente é criada junto com o personagem.

Pode ser alterada sempre que o jogador desejar.

---

# Persona

## Descrição

Persona representa aquilo que o personagem **é**.

Ela reúne todas as escolhas permanentes realizadas durante sua criação e evolução.

Enquanto o State muda constantemente durante uma sessão, a Persona muda apenas quando o personagem evolui ou quando alguma regra do jogo altera permanentemente sua construção.

---

## Responsabilidade

Descrever a identidade mecânica do personagem.

---

## Contém

A Persona pode conter referências para:

- Class;
- Subclass;
- Community;
- Ancestry;
- Features permanentes;
- Experiences.

Todos esses elementos representam decisões permanentes.

---

## Não contém

Persona nunca contém:

- HP;
- Hope;
- Stress;
- recursos temporários;
- equipamentos equipados;
- cartas preparadas.

---

## Relações

Persona referencia diversas Definitions.

Essas referências representam as escolhas feitas pelo jogador.

---

## Ciclo de Vida

É criada durante a criação do personagem.

Pode evoluir quando o personagem sobe de nível ou adquire novas características permanentes.

---

# Experiences

## Descrição

Experiences representam conhecimentos adquiridos pelo personagem ao longo de sua história.

Ao contrário das Definitions, Experiences não fazem parte do conteúdo oficial do jogo.

São criadas exclusivamente para um Character.

---

## Responsabilidade

Registrar competências narrativas do personagem.

---

## Contém

Cada Experience normalmente possui:

- nome;
- descrição opcional;
- valor;
- observações.

---

## Não contém

Experiences nunca descrevem regras oficiais do sistema.

Elas representam apenas conhecimento individual daquele personagem.

---

## Relações

Experiences pertencem à Persona.

Nunca pertencem a um Pack.

Nunca pertencem a uma Definition.

---

## Ciclo de Vida

São criadas durante a criação do personagem ou adquiridas durante a campanha.

Podem evoluir conforme permitido pelas regras.

---

# State

## Descrição

State representa o estado atual do personagem durante uma campanha.

Tudo aquilo que muda constantemente durante o jogo pertence ao State.

É o componente mais dinâmico do Character.

---

## Responsabilidade

Armazenar todas as informações transitórias do personagem.

---

## Contém

Exemplos:

- HP;
- Hope;
- Stress;
- Conditions;
- recursos temporários;
- efeitos ativos;
- bônus temporários;
- penalidades temporárias.

---

## Não contém

State nunca contém:

- Classe;
- Subclasse;
- Community;
- Ancestry;
- regras oficiais;
- descrição de cartas.

---

## Relações

State pode referenciar Definitions quando necessário.

Por exemplo:

- uma Condition;
- um efeito;
- uma carta ativa.

Entretanto, ele nunca copia essas informações.

---

## Ciclo de Vida

State sofre alterações continuamente durante uma sessão.

É restaurado ou atualizado conforme as regras do jogo.

---

# Inventory

## Descrição

Inventory representa tudo aquilo que pertence ao personagem.

Ele descreve a posse dos itens.

Não descreve os próprios itens.

---

## Responsabilidade

Registrar quais equipamentos e objetos pertencem ao personagem.

---

## Contém

Pode conter referências para:

- Weapons;
- Armor;
- Consumables;
- Equipment;
- Loot;
- Itens especiais.

---

## Não contém

Inventory nunca contém a descrição completa dos itens.

Essa informação permanece nas respectivas Definitions.

---

## Relações

Inventory referencia Definitions.

Ele nunca cria novos itens do jogo.

---

## Ciclo de Vida

Itens podem ser:

- adquiridos;
- equipados;
- removidos;
- descartados.

O componente permanece existindo durante toda a vida do Character.

---

# Deck

## Descrição

Deck representa o conjunto de cartas atualmente disponíveis para o personagem.

Ele não representa todas as cartas existentes.

Representa apenas aquelas que fazem parte da construção atual do personagem.

---

## Responsabilidade

Gerenciar quais cartas pertencem ao personagem em determinado momento.

---

## Contém

Referências para Cards.

Opcionalmente, informações sobre:

- preparação;
- organização;
- posição;
- seleção.

Essas decisões dependem da implementação.

---

## Não contém

Deck nunca contém:

- descrição das cartas;
- regras das cartas;
- efeitos.

Essas informações pertencem às Definitions.

---

## Relações

Deck referencia exclusivamente Cards.

---

## Ciclo de Vida

O Deck evolui durante a campanha.

Cartas podem ser:

- adicionadas;
- removidas;
- substituídas;
- reorganizadas.

Essas alterações nunca modificam as Definitions originais.

---

# Relações Entre os Componentes

O Character é composto pelos seguintes Componentes de Domínio:

```

Character
│
├── Identity
│
├── Persona
│ ├── Class
│ ├── Subclass
│ ├── Community
│ ├── Ancestry
│ ├── Features
│ └── Experiences
│
├── State
│ ├── HP
│ ├── Hope
│ ├── Stress
│ ├── Conditions
│ └── Temporary Effects
│
├── Inventory
│ └── Equipment References
│
└── Deck
└── Card References

```

Cada componente possui uma única responsabilidade.

Essa separação reduz o acoplamento entre os dados do personagem e permite que novas funcionalidades sejam adicionadas sem modificar todo o modelo.

---

# Princípios dos Componentes de Domínio

Todos os Componentes de Domínio seguem os mesmos princípios:

- pertencem exclusivamente ao Character;
- não possuem identidade própria;
- não existem fora de um Character;
- possuem uma única responsabilidade;
- podem referenciar Definitions;
- nunca modificam Definitions;
- armazenam apenas o estado necessário para aquele aspecto do personagem.

Essa organização mantém o agregado Character pequeno, coeso e fácil de evoluir ao longo do desenvolvimento do SoulForge.

# Catálogo de Definitions

Todas as Definitions pertencem exatamente a um Pack e seguem os mesmos princípios:

- são imutáveis;
- possuem um identificador único;
- podem referenciar outras Definitions;
- podem declarar Behaviors;
- nunca armazenam estado de um Character.

As seções abaixo descrevem apenas os tipos de Definition reconhecidos pelo domínio.

---

# Class

## Descrição

Representa uma classe jogável.

Uma Class define a identidade mecânica principal de um personagem.

---

## Responsabilidade

Descrever:

- progressão;
- características permanentes;
- acesso a cartas;
- regras específicas da classe.

---

## Relações

Pode referenciar:

- Features;
- Cards;
- Domains;
- Progression.

---

# Subclass

## Descrição

Especializa uma Class.

Uma Subclass nunca existe sem uma Class.

---

## Responsabilidade

Adicionar novas possibilidades de progressão.

---

## Relações

Pertence a uma Class.

Pode fornecer:

- Features;
- Cards;
- Behaviors.

---

# Card

## Descrição

Representa uma carta utilizável por um personagem.

---

## Responsabilidade

Descrever:

- requisitos;
- custo;
- efeitos;
- Behaviors.

---

## Relações

Pode referenciar:

- Domains;
- Features;
- outras Definitions.

---

# Domain

## Descrição

Representa um domínio de cartas.

---

## Responsabilidade

Agrupar cartas relacionadas.

---

## Relações

É referenciado por:

- Classes;
- Cards.

---

# Feature

## Descrição

Representa uma característica permanente.

---

## Responsabilidade

Adicionar capacidades ao personagem.

---

## Relações

Pode ser concedida por:

- Classes;
- Subclasses;
- Communities;
- Ancestries.

Pode declarar Behaviors.

---

# Weapon

## Descrição

Representa uma arma.

---

## Responsabilidade

Descrever propriedades permanentes da arma.

---

## Relações

Pode declarar Behaviors.

Pode ser referenciada pelo Inventory.

---

# Armor

## Descrição

Representa uma armadura.

---

## Responsabilidade

Descrever propriedades defensivas permanentes.

---

## Relações

Pode ser equipada pelo Character através do Inventory.

---

# Community

## Descrição

Representa a origem social do personagem.

---

## Responsabilidade

Conceder características permanentes definidas pelas regras do jogo.

---

## Relações

Pode conceder Features.

---

# Ancestry

## Descrição

Representa a ancestralidade do personagem.

---

## Responsabilidade

Definir características inerentes ao personagem.

---

## Relações

Pode conceder Features.

---

# Condition

## Descrição

Representa uma condição oficial do sistema.

---

## Responsabilidade

Descrever efeitos aplicáveis ao Character.

---

## Relações

É referenciada pelo State.

---

# Consumable

## Descrição

Representa um item consumível.

---

## Responsabilidade

Descrever recursos de uso limitado.

---

## Relações

Pode declarar Behaviors.

É referenciado pelo Inventory.

---

# Equipment

## Descrição

Representa equipamentos que não são armas nem armaduras.

---

## Responsabilidade

Descrever objetos permanentes utilizáveis.

---

## Relações

É referenciado pelo Inventory.

---

# Loot

## Descrição

Representa recompensas ou itens especiais encontrados durante a campanha.

---

## Responsabilidade

Descrever objetos únicos ou especiais.

---

## Relações

Pode ser armazenado no Inventory.

---

# Relações do Modelo

O domínio segue as seguintes relações fundamentais.

```
Pack
│
└── Definitions
     │
     ├── Class
     ├── Subclass
     ├── Card
     ├── Domain
     ├── Feature
     ├── Weapon
     ├── Armor
     ├── Community
     ├── Ancestry
     ├── Condition
     ├── Equipment
     ├── Consumable
     └── Loot

Character
│
├── Identity
├── Persona
├── State
├── Inventory
└── Deck

Character
        │
        │ referencia
        ▼
Definitions
```

Definitions nunca conhecem Characters.

Characters conhecem apenas os identificadores das Definitions.

---

# Regras de Integridade

O modelo de domínio deve respeitar permanentemente as seguintes regras.

## Separação entre conteúdo e estado

Definitions nunca armazenam estado de jogo.

Characters nunca armazenam cópias do conteúdo oficial.

---

## Imutabilidade

Definitions são imutáveis.

Qualquer alteração representa uma nova versão daquele conteúdo.

---

## Referências por Identificador

Objetos do domínio são relacionados exclusivamente por identificadores estáveis.

Nomes nunca devem ser utilizados como chave de relacionamento.

---

## Fonte Única da Verdade

Toda informação oficial do jogo deve existir em exatamente uma Definition.

Characters apenas referenciam essas informações.

---

## Responsabilidade Única

Cada componente do Character possui exatamente uma responsabilidade.

Cada tipo de Definition representa exatamente um conceito do jogo.

---

## Independência

Nenhum componente do Character depende da implementação da interface.

Nenhuma Definition depende da persistência.

O domínio permanece completamente independente da tecnologia utilizada.

---

# Ciclo de Vida do Domínio

O ciclo de vida do modelo pode ser resumido da seguinte forma.

```
Instalar Pack
        │
        ▼
Carregar Definitions
        │
        ▼
Criar Character
        │
        ▼
Referenciar Definitions
        │
        ▼
Modificar apenas o Character
        │
        ▼
Salvar Character
```

Durante toda a vida do sistema:

- Packs podem ser instalados;
- Definitions permanecem imutáveis;
- Characters evoluem;
- Behaviors são executados;
- o conteúdo oficial nunca é duplicado.

---

# Responsabilidades do Modelo

Este documento responde apenas às seguintes perguntas.

- Quais conceitos existem?
- Como eles se relacionam?
- Quem possui o quê?
- O que é permanente?
- O que é mutável?
- Quais são os limites dos agregados?
- Quais são as regras de integridade?

Questões relacionadas à implementação pertencem à arquitetura e ao código.

---

# Resumo

O modelo de domínio do SoulForge foi construído sobre três conceitos fundamentais:

- **Pack**, que organiza e distribui o conteúdo do jogo;
- **Definition**, que representa todo elemento permanente e reutilizável do sistema;
- **Character**, que representa o estado persistente de um personagem.

A separação entre conteúdo permanente e estado mutável é o princípio central do modelo. Ela permite que todo o conteúdo oficial seja compartilhado entre personagens, reduz a duplicação de dados e mantém o domínio independente de detalhes de implementação.

Todo o restante da arquitetura do SoulForge deriva dessa divisão.

# Glossário

| Termo                | Definição                                              |
| -------------------- | ------------------------------------------------------ |
| **Pack**             | Unidade de distribuição de conteúdo.                   |
| **Definition**       | Elemento permanente e reutilizável do jogo.            |
| **Character**        | Estado persistente de um personagem.                   |
| **Domain Component** | Parte interna de um Character, sem identidade própria. |
| **Behavior**         | Regra declarativa executada pelo motor.                |
| **Progression**      | Tipo especializado de Behavior que descreve evolução.  |
| **Reference**        | Ligação entre objetos por identificador estável.       |
