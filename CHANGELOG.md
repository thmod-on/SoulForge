# Changelog

Todas as mudanças relevantes do SoulForge serão registradas neste arquivo.

O formato segue, de maneira simplificada, a convenção de *Keep a Changelog* e as versões seguem o Versionamento Semântico.

## [0.11.0]

### Adicionado

- nova etapa na criação de personagem para escolher duas cartas de Domínio de nível 1, restritas aos domínios da classe e adicionadas ao Loadout inicial.

### Alterado

- seleção de item do Compendium reserva a área de confirmação para manter as miniaturas estáveis;
- etapa de classe da criação separa os valores iniciais de PV e Evasão dos campos de escolha;
- detalhe de classe no Compendium remove o marcador redundante de contexto.

## [0.10.0]

### Adicionado

- criação de personagem organizada em etapas: identidade, ancestralidades, Features, classe e revisão;
- escolha de até duas ancestralidades, com combinação explícita de Feature Top e Feature Bottom;
- busca de ancestralidades e descrições das Features selecionadas durante a criação.

### Alterado

- tela de Traços passa a apresentar as Features Top e Bottom efetivamente escolhidas para a ancestralidade do personagem;
- navegação da criação usa setas posicionadas nos extremos do rodapé e protege o formulário contra fechamento por clique acidental fora do modal;
- regras de navegação do assistente de criação separadas em módulo próprio.

## [0.9.2]

### Alterado

- interface, Progressao, Inventario e Anotacoes reorganizados em modulos por funcionalidade;
- Compendium separado por entidade: Dominios, Cartas, Itens, Classes e Ancestralidades;
- novas telas devem seguir a organizacao por feature, preservando o arquivo principal como orquestrador de estado, eventos globais e inicializacao.

## [0.9.1]

### Alterado

- conteúdo demonstrativo separado do Domínio oficial Dread por meio do novo Domínio Teste;
- listagens de Ancestralidades e Domínios refinadas com origem do Pack, indicação clara de conteúdo não editável e informações reorganizadas;
- cabeçalho do modo Editor permanece fixo enquanto o conteúdo rola;
- nomes e descrições de Packs locais padronizados em português do Brasil, com validação de codificação UTF-8;
- seletor técnico de arquivo ocultado após a prévia de importação de Pack.

### Corrigido

- trilha de subclasse informa corretamente Especialização no Tier 3 e Maestria no Tier 4;
- caracteres especiais dos arquivos de importação locais revisados e corrigidos.

## [0.9.0]

### Adicionado

- seleção e criação local de personagens, com persistência no dispositivo;
- catálogo de Ancestralidades no Compendium, incluindo cadastro, edição, exclusão e pesquisa;
- instalação de Packs locais a partir de arquivos `.soulforge-pack.json`, com prévia, validação, bloqueio de duplicidade e remoção confirmada;
- documentação de conteúdo, ancestralidades, Packs e dados locais para orientar o uso privado e responsável de material de terceiros.

### Alterado

- identidade visual do Compendium ampliada para acomodar ancestralidades e conteúdo importado;
- armazenamento local preparado para manter manifestos de Packs instalados e suas Definitions.

## [0.8.1]

### Alterado

- barra superior simplificada com a nova área Traços, reunindo Experiências e habilidades de Ancestralidade e Comunidade;
- Proficiência inicial da ficha de demonstração corrigida para 1;
- tela de Progressão reorganizada para aproveitar melhor a largura de tablets, com escolhas eletivas, carta de Domínio e confirmação em áreas distintas;
- carta obrigatória de Domínio passa a exibir uma miniatura estática quando selecionada.

### Adicionado

- arte original otimizada para a carta de demonstração Guardian's Ward, disponível no cache offline.

## [0.8.0]

### Adicionado

- seleção da carta obrigatória de Domínio durante a evolução, com destino escolhido entre Loadout e Vault;
- avanço opcional de carta de Domínio, respeitando os Domínios da classe e o Tier da carta;
- dados de Domínio Guardião e carta de demonstração para validar a progressão da classe.

### Corrigido

- espaços de avanço de cada Tier alinhados à regra: atributos com três espaços e PV/Estresse com dois;
- Especialização e Maestria de Subclasse disponibilizadas somente nos Tiers 3 e 4;
- escolhas de avanços pendentes agora são separadas por Tier;
- opções de avanço voltam a responder ao clique, sem conflito com a navegação entre Tiers.

## [0.7.3]

### Adicionado

- assistente de Progressão com escolhas temporárias, revisão e confirmação atômica;
- aplicação persistente de avanços de atributos, PV, Estresse, Evasão, Proficiência e features de Subclasse;
- histórico detalhado das evoluções e contador de espaços por avanço e por Tier.

### Alterado

- marcadores de atributos evoluídos são sincronizados com a sidebar e preservados ao reabrir a ficha;
- documentação de regras, Packs e plano técnico de Progressão ampliada.

## [0.7.2]

### Adicionado

- faixa visual da subclasse na Visão Geral, com Fundação, Especialização e Maestria;
- marcador de Proficiência na seção Combate da ficha.

### Alterado

- a barra lateral da ficha permanece fixa em telas menores, deixando a rolagem restrita ao conteúdo principal;
- dados do personagem de demonstração atualizados para o Guardião da subclasse Vengeance;
- a migração de fichas locais agora preenche a subclasse ausente em dados criados por versões anteriores;
- refinamentos de tipografia e estados visuais das features de subclasse.

## [0.7.1]

### Adicionado

- ativação de cartas do Vault para o Loadout, com troca gratuita no descanso ou Recall Cost em Stress fora dele;
- campo numérico de Recall Cost no cadastro de Cartas.

### Alterado

- miniaturas e detalhes de Cartas exibem Tier e Recall Cost de forma explícita;
- terminologia do deck atualizada para Vault e Loadout;
- ações de salvar do Compendium passam a usar a pena Unicode e ativação do Vault usa ação compacta por ícone;
- versão exibida nas Configurações sincronizada com a versão da aplicação.

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
