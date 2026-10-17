# Compendium

## Propósito

O Compendium é o catálogo de conteúdo do SoulForge.

Ele permite consultar e manter as **Definitions** reutilizáveis do sistema, como cartas, itens, classes e ancestralidades. Ele não representa o estado de um personagem durante uma sessão.

Assim, o Compendium separa:

- conteúdo permanente e reutilizável do jogo;
- dados locais e mutáveis de cada personagem.

Inventário, recursos, deck ativo, progressão e anotações pertencem ao personagem e não devem ser editados diretamente pelo Compendium.

## Metáfora de navegação

A interface do Compendium utiliza uma metáfora leve de livro de referência.

Em telas em paisagem, especialmente no iPad, o conteúdo é apresentado como uma abertura de duas páginas. A metáfora organiza o catálogo em capítulos, mas não exige que toda a listagem e todas as ferramentas apareçam simultaneamente na abertura inicial.

A metáfora deve reforçar a ambientação sem comprometer a rapidez de uso:

- não exigir animações tridimensionais ou demoradas;
- apresentar ações importantes de forma direta;
- permitir trocar de abertura por marcadores de capítulo e controles anterior/próxima;
- preservar uma navegação linear e acessível por teclado, mouse e toque.

Em resoluções menores, as páginas da mesma abertura passam a ser exibidas em sequência vertical, mantendo a ordem dos capítulos. A interface não deve reduzir listas completas e barras de ação até torná-las desconfortáveis para leitura ou toque.

## Índice, páginas de gerenciamento e modais

A tela inicial do Compendium funciona como um **índice compacto**. Ela apresenta os capítulos disponíveis com:

- nome e descrição breve;
- quantidade de Definitions cadastradas;
- ação para criar uma nova Definition;
- ação para pesquisar e gerenciar o capítulo.

O índice não deve renderizar simultaneamente listas completas, filtros, ações de edição e capítulos futuros. Essas informações tornam a abertura visualmente poluída, especialmente em resoluções de tablet mais compactas.

Cada ação **Pesquisar e gerenciar** abre uma página interna de capítulo em tela cheia. Essa página contém a listagem, a busca, os filtros e as ações de visualizar, editar e excluir.

Modais são reservados para operações focadas:

- criar uma nova Definition;
- editar uma Definition existente;
- consultar detalhes extensos;
- confirmar exclusões.

Não usar uma sequência de modais para pesquisa, listagem e edição, pois isso reduz a orientação espacial e prejudica a navegação no iPad.

## Capítulos atuais

As aberturas atuais do livro são:

| Abertura | Página esquerda | Página direita |
| --- | --- | --- |
| 1 | Domínios | Cartas |
| 2 | Itens | Classes e subclasses |
| 3 | Ancestralidades | Comunidades |
| 4 | Transformações | Condições |

Essa organização pode crescer conforme novos Packs forem instalados, sem alterar a responsabilidade de cada Definition.

## Conteúdo de cada capítulo

### Itens

Reúne itens que podem ser referenciados pelo inventário de um personagem:

- armas;
- armaduras;
- consumíveis;
- equipamentos;
- demais itens definidos por Packs.

A página de gerenciamento oferece busca, filtros por tipo e ações para criar, editar e excluir itens locais. Cada item pode definir categoria, tier, peso, valor, propriedades, descrição e imagem opcional. No índice, o capítulo mostra apenas seu resumo, `Novo item` e `Pesquisar e gerenciar`.

### Cartas

Reúne as cartas utilizáveis por personagens.

Domínios são a principal forma de organizar e filtrar cartas. A página de gerenciamento de Cartas permite:

- consultar todas as cartas;
- filtrar por domínio;
- pesquisar por nome e texto;
- criar, editar e excluir cartas.

No índice, o capítulo mostra apenas seu resumo, `Nova carta` e `Pesquisar e gerenciar`.

### Domínios

Domínios são Definitions que classificam as Cartas. Cada carta deve pertencer a exatamente um domínio.

A página de gerenciamento permite criar, editar e excluir domínios locais com nome, descrição e cor. Um domínio com cartas vinculadas não pode ser removido sem antes transferir ou excluir essas cartas.

### Classes e subclasses

Reúne classes jogáveis e suas subclasses. Uma subclasse pertence sempre a uma classe.

Features concedidas por Classes ou Subclasses são consultadas e editadas como parte de sua origem. Não há capítulo próprio: origem, tier, custo, marcador e ativação podem depender da Definition que as concede.

### Ancestralidades e comunidades

Reúnem as opções de identidade do personagem:

- ancestralidades definem características inerentes;
- comunidades representam a origem social e podem conceder características.

Ancestralidades possuem duas features ordenadas — Top e Bottom — para suportar ancestralidade única e mista. O comportamento de criação, seleção e validação está definido em [ANCESTRY.md](ANCESTRY.md).

Os dois tipos possuem página de gerenciamento, detalhes e CRUD de conteúdo
local. Features associadas reutilizam o mesmo editor declarativo e podem
fornecer modificadores de ficha, ativações e marcadores compatíveis com seus
contratos.

### Transformações

Reúne escolhas opcionais de identidade com benefício, desvantagem, perguntas
narrativas e marcadores declarativos opcionais. O Compendium já oferece busca,
detalhes, CRUD local e importação por Pack.

A ficha permite conceder, substituir e remover uma transformação, respeitando
o limite de uma por personagem. Ela integra a herança sem consumir o limite
normal de cartas; consultar [Transformações](TRANSFORMATIONS.md).

### Condições

Reúne estados temporários e especiais, com efeito, forma de encerramento e
origem identificada. O Compendium oferece busca, detalhes, CRUD local e
importação por Pack. Na ficha, Condições e suas origens ficam na faixa Estados
em cena; consultar [Condições](CONDITIONS.md).

Features permanecem apresentadas no contexto da Definition que as concede.
Elas não possuem capítulo, busca ou CRUD independentes, para evitar conteúdo
avulso sem origem, tier e regras válidas. A decisão só deve ser reaberta se
uma Feature passar a ser escolhida independentemente, se a busca global se
tornar uma necessidade comprovada em mesa, ou se o mesmo conteúdo precisar
ser reutilizado com segurança por múltiplas origens.

## CRUD e segurança

Cada capítulo pode disponibilizar criação, edição, consulta e exclusão das Definitions correspondentes.

Como Definitions podem ser usadas por personagens e Packs, a exclusão exige confirmação explícita. A confirmação deve indicar qual conteúdo será removido e alertar quando ele poderá ficar indisponível para personagens existentes.

O Compendium não deve apagar ou alterar automaticamente os dados locais de um personagem. Qualquer impacto de uma Definition removida deve ser tratado por uma regra explícita do domínio.

## Relação com Packs

Packs fornecem Definitions para o catálogo. O Compendium consulta essas
Definitions e oferece ferramentas para cadastrar conteúdo local. Instalação,
atualização e remoção de Packs já são administradas em Configurações.

O gerenciamento de instalação, atualização e remoção de Packs pertence às Configurações, não à navegação principal do Compendium.

## Princípios de implementação

- O Compendium trabalha com Definitions, nunca com cópias do conteúdo dentro de Characters.
- Relações entre conteúdos usam identificadores estáveis.
- Domínios agrupam Cartas e servem como filtro de consulta.
- Features são apresentadas e mantidas no contexto da Definition que as
  concede; o Compendium não permite Features avulsas.
- A interface deve favorecer consulta rápida durante a mesa, com alvos de toque adequados ao iPad.
- A exclusão deve respeitar as diretrizes de UX do projeto e sempre pedir confirmação.

## Estado atual

O índice em formato de livro reúne **Domínios**, **Cartas**, **Itens**,
**Classes e subclasses**, **Ancestralidades**, **Comunidades**,
**Transformações** e **Condições**. Cada abertura reúne dois assuntos e mantém
a mesma separação entre índice, página de gerenciamento e modais focados.

Domínios, Cartas e Itens possuem fluxos completos:

1. `Nova carta` abre um modal de cadastro com imagem opcional, nome, domínio, tier, custo e efeito;
2. `Pesquisar e gerenciar` abre a página interna de Cartas;
3. a página permite buscar por nome ou texto e filtrar por domínio e tier;
4. cada resultado permite visualizar detalhes, editar e excluir com confirmação.

Itens seguem o mesmo padrão de gerenciamento. Além disso, a ficha do
personagem permite selecionar uma Definition do Compendium e adicioná-la
diretamente a um container compatível, respeitando categoria, peso e
capacidade.

Classes, ancestralidades e comunidades integram suas escolhas à criação e à
ficha, incluindo suas Features contextuais. Transformações podem ser
concedidas e consultadas na ficha; Condições podem ser aplicadas com origens
independentes na faixa Estados em cena.
