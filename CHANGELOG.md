# Changelog

Todas as mudanças relevantes do SoulForge serão registradas neste arquivo.

O formato segue, de maneira simplificada, a convenção de *Keep a Changelog* e as versões seguem o Versionamento Semântico.

## [0.26.6]

### Adicionado
- Ativações de ancestralidade na ficha, com lembretes de custos recorrentes manuais e encerramento pelo jogador.
- Escolha entre você e aliado para efeitos direcionados, sem aplicar à própria defesa bônus destinados a terceiros.
- Packs privados de ancestralidades 1.2.0-local com Retrair-se, Ignição, Olho da Tempestade e voo de Faerie e Aetheris.

## [0.26.5]

### Adicionado

- bônus permanentes de ancestralidade declarados nos packs: Casco do Galapa, Resistência do Gigante, Alta Resistência do Humano, Ágil do Simiah e Pele de Pedra do Earthkin;
- ancestralidades mistas passam a aplicar esses bônus conforme as Features Top e Bottom efetivamente escolhidas.

## [0.26.4]

### Adicionado

- efeitos ativos de Features podem declarar fichas efêmeras, originadas por rolagem, atributo de Conjuração ou escolha do jogador, com controle visual de consumo;
- Misturas Tóxicas, Talismã Encantado, Caminhar Entre Mundos e Círculo de Poder passam a usar esse modelo no pack Hope & Fear.

## [0.26.3]

### Adicionado

- cartas podem declarar requisitos verificáveis de armadura equipada ou quatro cartas do mesmo domínio no Loadout; quando atendidos, seus bônus aparecem em Efeitos ativos;
- reserva reutilizável de dados armazenados: guardar após rolar com Esperança, gastar vários dados, rolar e somar o resultado, com recuperação declarativa no fim da sessão;
- Matador do Guerreiro passa a declarar Dados do Matador: d6, capacidade igual à Proficiência e recuperação de 1 Esperança por dado não gasto ao encerrar a sessão.

### Alterado

- previews das Cartas ativas exibem o domínio em vez do tipo editorial e usam um degradê discreto na cor do domínio, independente de haver arte;
- o pack Core — Classes e Subclasses foi revisado para a versão `1.12.0-local`; o pack Core — Domínios e Cartas permanece em `1.9.0-local`.

## [0.26.2]

### Adicionado

- cartas podem declarar modificadores passivos de atributos, Evasão, Armadura e limiares, aplicados automaticamente somente enquanto estiverem no Loadout;
- Intocável (Untouchable) passa a conceder Evasão igual à metade da Agilidade, com arredondamento para cima.

### Corrigido

- avanços permanentes de Evasão são reconstruídos a partir do histórico da progressão, incluindo escolhas já registradas;
- Features recebidas pela Multiclasse passam a participar do cálculo dos modificadores permanentes da ficha.

## [0.26.1]

### Alterado

- visão geral da ficha prioriza as Cartas ativas antes das Features de subclasse; limiares de dano passam a destacar cada valor em sua sequência de severidade;
- detalhes de armas exibem dano, tipo de dano, atributo de ataque, alcance e empunhadura tanto no Compendium quanto antes de adicionar o item ao inventário;
- abas do Compendium passam a usar a nomenclatura de capítulos.

### Corrigido

- detalhes de Itens e Cartas abrem corretamente quando o Compendium é acessado pelo seletor de personagens, sem reaparecer ao entrar em uma ficha;
- novas fichas preservam PV, Estresse, Armadura e Esperança sem marcas iniciais, com cobertura automatizada para bônus de ancestralidade.

## [0.26.0]

### Adicionado

- catálogo de Transformações, com conteúdo local privado, detalhes completos e ilustrações originais incorporadas ao Pack;
- movimento de downtime Preparação em grupo, que recupera 2 Esperanças.

### Alterado

- PV, Estresse, Armadura e Esperança passam a registrar marcas: novas fichas começam em `0/x`, custos aumentam a marcação e recuperações a reduzem;
- personagens sem Armadura usam limiar menor igual ao nível e limiar maior igual ao dobro do nível.

### Corrigido

- detalhes de Transformações preservam a posição de rolagem do Compendium;
- sincronização de máximos de PV e Estresse considera corretamente os avanços já escolhidos e os bônus de ancestralidade.

## [0.25.1]

### Alterado

- seleção de personagens e distribuição de atributos recebem ajustes de composição para telas compactas;
- conclusão de uma evolução passa a apresentar um estado final discreto, confirmando o novo nível alcançado.

### Corrigido

- escolhas no fluxo de criação e nos diálogos de progressão passam a atualizar somente a área necessária, reduzindo piscadas e preservando a leitura em iPad;
- filtros e seleção de cartas na progressão mantêm o painel de escolha estável.

## [0.25.0]

### Adicionado

- exportação de fichas para arquivos `.soulforge-character.json`, com os dados completos do personagem;
- importação de fichas com prévia, validação e criação segura de uma nova identidade quando já houver uma ficha com o mesmo identificador;
- acesso à importação diretamente pelo seletor de personagens.

### Alterado

- Configurações passa a oferecer a importação de personagem; a exportação só fica disponível com uma ficha ativa;
- documentação de dados locais e arquitetura passa a registrar o fluxo de transferência de fichas.

### Corrigido

- a área de erro da importação de Packs não é mais exibida vazia ao abrir o modal.

## [0.24.2]

### Alterado

- a aplicação passa a abrir sempre no seletor de personagens, em vez de retomar automaticamente a última ficha;
- a abertura e o fechamento de detalhes da ficha preservam a posição de leitura, incluindo cartas, itens, anotações, recursos e retrato.

## [0.24.1]

### Adicionado

- identidade visual documentada, com tokens, superfícies, estados e componentes-base reutilizáveis;
- suporte unificado a imagens locais em retratos e conteúdo do Compendium, com limites e comportamento de exibição definidos;
- texturas leves e fallbacks visuais para áreas sem imagem, preservando contraste e desempenho em iPad.

### Alterado

- ficha, Compendium, seleção de personagem e fluxos guiados passam a compartilhar superfícies, filtros, controles e pistas de rolagem consistentes;
- identidade do personagem recebe maior destaque na topbar, enquanto a navegação permanece secundária;
- ativação de cartas do Vault passa a apresentar alternativas contextualizadas e clicáveis por inteiro.

### Corrigido

- modais de ativação de carta e de definição de dados de marcadores recebem molduras, foco visual e botão de fechar alinhado;
- áreas roláveis, cartões de inventário, estados de interface e layouts compactos foram ajustados para melhor uso por toque e telas baixas.

## [0.24.0]

### Adicionado

- editor declarativo único de Features, reutilizado por classes, subclasses, ancestralidades e comunidades, com suporte a marcadores de contador ou dados;
- áreas com rolagem interna passam a receber indicação visual discreta, apropriada para a interface escura e para uso por toque.

### Alterado

- catálogo para adicionar itens reutiliza o visual dos itens do inventário e mantém títulos longos legíveis;
- formulário de Comunidades passa a usar o mesmo contrato mecânico de Features das demais fontes.

### Corrigido

- detalhes de item abertos a partir do catálogo retornam à seleção de itens ao fechar;
- modal de identidade da ficha não repete o rótulo de classe nas Features.

## [0.22.1]

### Alterado

- seção de Combate da sidebar adota cartões compactos e consistentes para Evasão, Armadura, Proficiência e limiares;
- cartões de recursos ficam mais compactos, preservando os controles diretos de aumentar e reduzir para uso em iPad.

### Corrigido

- marcadores de recurso de Armadura agora somam os bônus declarados por todos os itens equipados, incluindo escudos e outros equipamentos.

## [0.22.0]

### Adicionado

- catálogo de adição de itens passa a oferecer busca textual, filtros por nível e consulta detalhada antes da seleção;
- seleção de item preserva a posição de rolagem da ficha e da lista interna ao abrir e fechar detalhes.

### Alterado

- filtros de categoria e nível do Inventário e Compendium usam o mesmo estado visual ativo da navegação da ficha;
- filtros de nível de itens seguem a leitura compacta `Nível · Todos · 1 · 2...` usada na seleção de cartas.

### Corrigido

- catálogo de itens mantém sua área estável ao trocar filtros e não corta a indicação do item selecionado.

## [0.21.3]

### Alterado

- criação de personagem passa a manter cabeçalho estável entre etapas e apresenta comunidade com busca, filtro de Pack e benefício expandido no próprio card;
- escolha de cartas da Progressão recebe filtros compactos por domínio e nível, além de estado ativo alinhado à navegação da ficha;
- modais de escolha de carta passam a reservar altura compatível com a tela e rolar somente a lista de cartas.

### Corrigido

- cards compactos e expandidos de cartas preservam arte, texto e limites de leitura mesmo com títulos ou efeitos longos.

## [0.21.2]

### Adicionado

- inventário passa a suportar pilhas independentes: separar, mover parcialmente ou descartar apenas a quantidade escolhida;
- seleção compacta de compartimento no modal de item, adequada também para fichas com muitos containers.

### Alterado

- fluxo de Progressão foi simplificado e alinhado às seções da ficha: contexto enxuto, histórico compacto e avanços em duas colunas;
- nível e experiência passam a ser exibidos de forma discreta no rodapé da sidebar.

### Corrigido

- ações do modal de item permanecem acessíveis em telas baixas, com descarte fixo no rodapé interno.

## [0.21.1]

### Alterado

- seleção de cartas na criação e na progressão mantém cartões compactos e expande apenas a carta em foco para leitura completa;
- Traços passa a concentrar a identificação de classe e subclasse, enquanto a sidebar preserva nome e origem narrativa;
- navegação do editor recebe o mesmo destaque discreto usado na ficha do personagem.

### Corrigido

- cartões da abertura do Compendium mantêm textos extensos em sua área, com rolagem interna quando necessária;
- controles de avanço da criação recebem ajustes defensivos para interação por toque em iPad.

## [0.21.0]

### Alterado

- páginas de consulta do Compendium adotam uma estrutura visual comum e mais compacta para domínios, cartas, itens, classes, ancestralidades e comunidades;
- Visão Geral apresenta as features de subclasse como cartões compactos, com detalhes completos acessíveis por toque;
- navegação superior da ficha passa a usar abas mais discretas, com destaque visual na seção ativa.

### Corrigido

- detalhes de features de subclasse agora usam a definição atual do Pack instalado após uma reimportação;
- ancestralidades e comunidades do Compendium passam a abrir seus detalhes ao selecionar o cartão.

## [0.20.1]

### Corrigido

- aberturas do Compendium agora calculam a altura pela página com mais conteúdo, mantêm as duas folhas alinhadas e usam rolagem interna sem cortar cards longos;
- cabeçalho compacto do editor mantém a ação de retorno à ficha em posição estável.

## [0.20.0]

### Adicionado

- downtime guiado para descansos breve e longo, com movimentos e recuperação declarada;
- modificadores declarativos de ficha em Features de ancestralidade, para recursos e defesa;
- suporte a bônus de Estresse do Humano, PV do Gigante, defesa do Galapa e Simiah, e Armadura do Terrano;
- edição local de ancestralidades com bônus máximo de recurso;
- ícones específicos do SoulForge para instalação como PWA e tela inicial do dispositivo.

### Alterado

- recursos de Armadura passam a preservar seu máximo-base antes de modificadores permanentes;
- formulários e fluxo de criação de personagem receberam ajustes de apresentação e navegação;
- o módulo de ancestralidades foi reorganizado para concentrar autoria e persistência local.

### Corrigido

- sincronização da ficha agora aplica os efeitos estruturados das Features de ancestralidade selecionadas.

## [0.19.0]

### Adicionado

- comunidades no Compendium, com criação local, importação por Pack e Feature associada à ficha;
- etapa de comunidade no assistente de criação de personagem;
- suporte a quantidade de marcadores declarada pelo nível do personagem;
- visualização completa das múltiplas Features de subclasses durante a criação da ficha.

### Alterado

- criação de personagem reorganizada para escolher Classe e subclasse antes dos Atributos;
- etapa de Atributos destaca o atributo de Conjuração definido pela subclasse escolhida;
- revisão da ficha exibe Comunidade como uma escolha estruturada;
- renderização de classe e subclasse foi organizada no módulo próprio da criação de personagem.

### Corrigido

- visibilidade dos painéis do assistente de criação após a reorganização das etapas.

## [0.18.0]

### Adicionado

- assistente de Progressão por etapas, com avanços, carta de Domínio, conquista de Tier quando aplicável e revisão final;
- destaque visual do atributo de Conjuração na ficha e suporte de compatibilidade para personagens já criados;
- definição de atributo de Conjuração por subclasse no cadastro de classes locais.

### Alterado

- os packs locais de classes Core e Hope & Fear passam a declarar os atributos de Conjuração das subclasses aplicáveis;
- a tela de Progressão reutiliza a identidade visual do fluxo de criação de personagem.

## [0.17.0]

### Adicionado

- revisão declarativa de marcadores nas cartas dos packs Core e Hope & Fear, sem inferir regras por texto livre;
- seleção guiada de atributos na criação de personagem, com valores disponíveis e opção de reset;
- verificação arquitetural automática para preservar as fronteiras entre `main.ts` e as features.

### Alterado

- limiares de dano agora recebem o nível do personagem e modificadores de equipamentos;
- cartas recebidas na Progressão são aprendidas diretamente no Vault;
- a interface passa a chamar o valor das cartas de nível, reservando Tier para a progressão do personagem;
- a etapa de atributos da criação foi extraída para o módulo responsável.

## [0.16.0]

### Adicionado

- escolha de experiências na criação de personagem;
- fluxo inicial de Multiclasse na Progressão, com classe, Domínio e Features adicionais;
- complementos locais de marcadores para cartas vindas de packs, sem alterar seu conteúdo original;
- metadado declarado para o contador de Palavras Inspiradoras, vinculado à Presença e ao descanso longo.

### Alterado

- criação de personagem dividida em módulos de fluxo, regras e apresentação;
- contadores de marcadores passam a aceitar quantidade dinâmica por atributo;
- banco local atualizado para guardar complementos de metadados de cartas.

## [0.15.0]

### Adicionado

- controles diretos de aumentar e reduzir recursos na ficha;
- ficha-demo Kael II, criada com as referências atuais dos packs;
- autoria opcional de marcadores de jogo para cartas e classes, com contador ou dados.

### Alterado

- formulário de marcadores passa a orientar e habilitar somente os campos aplicáveis ao tipo escolhido;
- lista de classes do Compendium passa a identificar o pack de origem e exibir o nome original das classes oficiais.

### Corrigido

- sincronização de marcadores aceita referências legadas de classes e subclasses por compatibilidade;
- alinhamento dos campos no cadastro de cartas.

## [0.14.0]

### Adicionado

- criação de recursos personalizados diretamente pela ficha, com nome, valores e cor;
- interação de dados por slots geométricos, preparada para d4 e d6, com confirmação antes do consumo.

### Alterado

- marcadores de jogo compactados e integrados às ações rápidas da ficha;
- ação de reiniciar marcadores de sessão movida para as ações rápidas;
- ação de adicionar recurso movida para o cabeçalho de Recursos.

## [0.13.0]

### Adicionado

- foto local para cada personagem, com troca pela ficha e visualização ampliada;
- modificadores de combate declarativos em itens equipados, aplicáveis a Armadura, Evasão e Limiares.

### Alterado

- a trilha de Armadura é sincronizada automaticamente com o valor da armadura equipada;
- dados de marcadores passam a permitir registrar individualmente resultado e uso;
- miniatura do retrato preserva o espaço da sidebar, enquanto a imagem completa pode ser ampliada.

### Corrigido

- movimentar itens entre containers preserva a posição de rolagem da ficha.

## [0.12.0]

### Adicionado

- base de marcadores de jogo declarativos, com contadores e dados sincronizados automaticamente a partir de fontes ativas da ficha;
- distribuição obrigatória de atributos e detalhes de subclasses na criação de personagem;
- exclusão confirmada de fichas locais pela seleção de personagens.

### Alterado

- fluxo de criação preserva a posição de rolagem durante escolhas e simplifica etapas redundantes;
- etapas de atributos e classe foram alinhadas visualmente às demais etapas da criação.

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
