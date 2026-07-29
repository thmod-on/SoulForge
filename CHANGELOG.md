# Changelog

Todas as mudanças relevantes do SoulForge serão registradas neste arquivo.

O formato segue, de maneira simplificada, a convenção de *Keep a Changelog* e as versões seguem o Versionamento Semântico.

## [0.7.0]

### Adicionado

- CRUD local de Classes, Subclasses e Características no Compendium;
- contrato de dados para Classes, com dois Domínios, Evasão e HP iniciais, Característica de Esperança e duas Subclasses;
- tela de detalhes de Classe, incluindo características, Domínios e Subclasses em abas;
- documentação de Classes e Progressão do Daggerheart.

### Alterado

- formulário de Classes reorganizado para tablets, com descrições expandidas e abas de Subclasses;
- modais passam a fechar pelo fundo apenas quando o clique começa nele, evitando fechamentos durante seleção de texto;
- detalhe de Classe mantém a arte fixa enquanto a coluna de conteúdo é rolada em telas amplas.

## [0.6.0]

### Adicionado

- CRUD local de Itens no Compendium, com categoria, tier, peso, valor, propriedades e imagem opcional;
- segunda abertura navegável do Compendium, reunindo Itens e o capítulo preparado de Classes;
- ação para adicionar itens do Compendium diretamente a cada container do Inventário, com quantidade e validação de peso/categoria;
- proteção contra excluir itens locais que estejam presentes no inventário atual.

### Alterado

- tiles de itens padronizados entre Inventário, Compendium e seletor de adição;
- modal de adição de itens ampliado, com altura estável e uma única região rolável;
- busca removida do Inventário da ficha;
- arrastar e soltar passou a considerar também o container de origem e funciona sobre imagens;
- criação de Cartas volta a permitir selecionar o tipo; miniaturas do deck exibem apenas esse tipo;
- imagem no detalhe de uma carta passa a ser exibida inteira, sem recorte;
- cabeçalho do modo Editor simplificado.

## [0.5.0]

### Adicionado

- CRUD local de Domínios no Compendium, com nome, descrição e cor de identidade;
- CRUD local de Cartas, com domínio obrigatório, tier, custo, efeito e imagem opcional;
- persistência offline de Definitions locais no IndexedDB;
- proteção para o conteúdo importado por Packs;
- confirmação de exclusão e bloqueio de remoção quando houver cartas ou deck vinculados.

### Alterado

- índice do Compendium reorganizado para manter Domínios e Cartas na mesma abertura;
- formulários de Cartas simplificados e comandos de salvar/cancelar padronizados por ícones temáticos;
- Configurações passa a usar o símbolo de pergaminho na navegação.

## [0.4.0]

### Adicionado

- modo Editor/Admin em tela cheia para Compendium e Configurações;
- página interna de gerenciamento de Cartas no Compendium;
- busca textual, filtros por domínio e tier na página de Cartas;
- abertura de detalhes da carta ao clicar no resultado inteiro.

### Alterado

- sidebar compactada para melhorar o uso em tablet;
- ações globais de Compendium e Configurações movidas para ícones na região da marca;
- resultados de cartas no Compendium refinados para agrupar conteúdo e ações em uma única moldura.

## [0.3.0]

### Adicionado

- versão inicial visual do Compendium como índice de livro;
- capítulos iniciais de Itens e Cartas com ações preparadas para criação e gerenciamento;
- documentação de Compendium, Packs, dados locais, PWA/offline, padrões de interface e releases;
- regra de versionamento e checklist de release.

### Alterado

- sidebar com ícones temáticos para Compendium e Configurações;
- Compendium ajustado para evitar exibir listas completas na abertura inicial;
- visual do Compendium refinado para diferenciar capa/folha externa e página interna de consulta.

## [0.2.0]

### Adicionado

- telas de Habilidades, Experiências, Cartas guardadas, Progressão, Anotações e Configurações;
- containers adicionais no inventário, com criação, remoção confirmada e movimentação de itens por toque;
- modais para detalhes de cartas e itens, recursos, anotações e confirmações;
- persistência local de recursos, anotações, inventário e containers.

### Alterado

- refinamento visual da visão geral, inventário, progressão e demais telas para tablet em paisagem;
- estrutura de inventário organizada em Equipados, Mochila e containers adicionais;
- navegação e sidebar simplificadas.

## [0.1.0]

### Adicionado

- base da PWA em TypeScript, com suporte offline e publicação no GitHub Pages;
- personagem e conteúdo demonstrativos para validar os fluxos principais.
