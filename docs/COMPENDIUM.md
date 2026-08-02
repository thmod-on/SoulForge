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

## Capítulos previstos

As aberturas iniciais do livro são:

| Abertura | Página esquerda | Página direita |
| --- | --- | --- |
| 1 | Domínios | Cartas |
| 2 | Itens | Classes e subclasses |
| 3 | Ancestralidades | Condições futuras |

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

Características permanentes concedidas por classes ou subclasses devem aparecer como parte de sua origem, sem exigir inicialmente um capítulo próprio.

### Ancestralidades e comunidades

Reúnem as opções de identidade do personagem:

- ancestralidades definem características inerentes;
- comunidades representam a origem social e podem conceder características.

Ancestralidades possuem duas features ordenadas — Top e Bottom — para suportar ancestralidade única e mista. O comportamento de criação, seleção e validação está definido em [ANCESTRY.md](ANCESTRY.md).

### Condições e características

São tipos reconhecidos pelo modelo de domínio, mas podem ser introduzidos em uma etapa futura, quando houver conteúdo e fluxos de uso suficientes para justificá-los como capítulo próprio.

## CRUD e segurança

Cada capítulo pode disponibilizar criação, edição, consulta e exclusão das Definitions correspondentes.

Como Definitions podem ser usadas por personagens e Packs, a exclusão exige confirmação explícita. A confirmação deve indicar qual conteúdo será removido e alertar quando ele poderá ficar indisponível para personagens existentes.

O Compendium não deve apagar ou alterar automaticamente os dados locais de um personagem. Qualquer impacto de uma Definition removida deve ser tratado por uma regra explícita do domínio.

## Relação com Packs

Packs fornecem Definitions para o catálogo. O Compendium consulta essas Definitions e pode, futuramente, oferecer ferramentas para cadastrar conteúdo local ou administrar Packs instalados.

O gerenciamento de instalação, atualização e remoção de Packs pertence às Configurações, não à navegação principal do Compendium.

## Princípios de implementação

- O Compendium trabalha com Definitions, nunca com cópias do conteúdo dentro de Characters.
- Relações entre conteúdos usam identificadores estáveis.
- Domínios agrupam Cartas e servem como filtro de consulta.
- Características são apresentadas no contexto da Definition que as concede.
- A interface deve favorecer consulta rápida durante a mesa, com alvos de toque adequados ao iPad.
- A exclusão deve respeitar as diretrizes de UX do projeto e sempre pedir confirmação.

## Escopo inicial

O primeiro recorte visual implementa um índice de livro com os capítulos **Domínios**, **Cartas** e **Itens**, usando o conteúdo atualmente disponível no pacote demo.

Os primeiros fluxos completos são Domínios, Cartas e Itens:

1. `Nova carta` abre um modal de cadastro com imagem opcional, nome, domínio, tier, custo e efeito;
2. `Pesquisar e gerenciar` abre a página interna de Cartas;
3. a página permite buscar por nome ou texto e filtrar por domínio e tier;
4. cada resultado permite visualizar detalhes, editar e excluir com confirmação.

Itens seguem o mesmo padrão de gerenciamento. Além disso, a ficha do personagem permite selecionar uma Definition do Compendium e adicioná-la diretamente a um container compatível, respeitando categoria, peso e capacidade.

Os capítulos seguintes devem manter a estrutura de índice, página de gerenciamento e modais focados, sem exigir uma mudança de arquitetura.
