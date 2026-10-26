# Padrões de interface

## Contexto de uso

O SoulForge prioriza tablet em paisagem, especialmente iPad, e deve se comportar bem em desktop. Celular não é o foco inicial.

A interface favorece leitura rápida e ações de sessão em tela única, evitando a aparência excessiva de páginas de site empilhadas em cartões.

As cores, tokens, comportamento de modais e regras de movimento são definidos em [VISUAL_IDENTITY.md](VISUAL_IDENTITY.md). Este documento define a aplicação prática desses padrões nas telas.

## Navegação

- a barra superior contém as áreas de personagem: Visão geral, Traços, Inventário, Progressão e Anotações;
- a navegação lateral reúne áreas globais, como Compendium e Configurações;
- áreas secundárias podem usar abas, filtros ou accordions sem duplicar a navegação principal.

## Modais

Use modal quando a ação precisa de foco e não deve tirar o usuário da tela atual:

- detalhes de cartas e itens;
- ajuste de recursos;
- criação e edição de anotação ou container;
- confirmação de ações destrutivas.

O modal deve ter título, ação de fechar, fechamento por `Escape` quando houver teclado e clique fora quando isso não comprometer um formulário em andamento. Em formulários com edição, o clique no backdrop não fecha o modal. O cabeçalho e o rodapé de ações permanecem previsíveis, enquanto apenas o corpo rola. A superfície mantém no mínimo `1rem` de margem ao redor do viewport, respeita áreas seguras e oferece alvos de toque de pelo menos `44px` para fechar e confirmar ações.

## Ações destrutivas

Excluir, descartar ou remover dados exige confirmação explícita. A confirmação informa o que será perdido e, quando aplicável, que a ação não pode ser desfeita.

Recursos criados pela pessoa usuária usam um menu `•••` no próprio cartão para
separar a remoção dos controles incrementais. O menu permanece acessível em
dispositivos touch e não é exibido em recursos principais, derivados ou
concedidos por regras. A confirmação identifica nome e valor atual do recurso.

Consulte também [UX_GUIDELINES.md](UX_GUIDELINES.md).

## Configurações

- Configurações reúne somente utilitários que funcionam no momento; versão e estado offline aparecem como contexto compacto, não como um painel expansível;
- Nuvem, Conteúdo e Packs e Backup e compartilhamento usam uma única coluna, na ordem de uso mais frequente;
- a lista de Packs mostra sua contagem e rola dentro de uma altura limitada e responsiva. Quando houver conteúdo oculto, um trilho e uma dica fixa indicam se há mais conteúdo abaixo ou o retorno ao topo; a remoção em massa fica fora dela, em zona destrutiva explícita;
- exportar ou importar uma ficha pertence ao seletor de personagens: a importação fica na ação auxiliar da tela e a exportação no menu `•••` de cada ficha;
- opções sem contrato de produto, como aparência, regras de carga e regras de progressão, não aparecem como controles inativos.

## Inventário

- Equipados e Mochila são containers padrão;
- containers adicionais possuem capacidade e regras próprias;
- itens podem ser movidos por menu ou por arrastar e soltar com Pointer Events;
- a interface valida capacidade e compatibilidade antes de concluir uma movimentação;
- detalhes de item usam modal para preservar a posição de leitura da lista.

## Conteúdo visual

- cartas, itens e elementos de defesa usam silhuetas e bordas próprias para reforçar o universo do produto;
- alvos de toque devem permanecer confortáveis para uso em tablet;
- componentes densos podem reduzir espaçamento e tipografia nos breakpoints de tablet, sem sacrificar legibilidade;
- rótulos e estados não devem depender apenas de cor.

### Coleções horizontais responsivas

- coleções pequenas que perdem legibilidade quando comprimidas podem mudar de grade para trilho horizontal conforme a largura real do container, não apenas do viewport;
- cada item mantém largura e altura previsíveis, com títulos e resumos limitados; o conteúdo completo permanece acessível em detalhe ou modal;
- uma fração do próximo item funciona como pista de continuidade, complementada por `scroll-snap` e rolagem por toque;
- controles laterais só aparecem quando existe conteúdo naquela direção, não alteram a largura do trilho e não devem cobrir títulos ou ações;
- em dispositivos predominantemente touch, os controles podem ser ocultados quando o gesto horizontal for suficiente;
- a região rolável recebe nome acessível, foco por teclado e não exibe uma barra de rolagem visual pesada.

O Loadout da ficha e a seleção de personagens seguem esse padrão. O Vault conserva a grade, pois sua finalidade principal é consulta e gerenciamento de uma coleção potencialmente maior.

### Transformações na ficha

- a transformação é uma herança ativa do personagem e nunca deve parecer uma carta ou ocupar espaço no Loadout;
- seu resumo compacto aparece depois de Recursos especiais e Marcadores de jogo, antes das Cartas ativas;
- benefício, desvantagem e notas de regra ficam em um modal de detalhes, evitando aumentar permanentemente a altura da ficha;
- escolher, substituir e remover uma transformação são ações explícitas. A remoção exige confirmação e preserva o estado de marcadores já registrado, deixando-os apenas inativos;
- quando a definição não estiver disponível no Pack atual, a referência permanece preservada e a interface explica por que seus efeitos não estão sendo aplicados.
- escolhas de conteúdo da transformação aparecem em modo somente leitura na ficha; alterações que custem um movimento pertencem ao fluxo de descanso, sem botão redundante na seção da transformação;
- ações contextuais de descanso permanecem visíveis quando indisponíveis, usando `aria-disabled` e uma explicação acessível sobre o requisito, para antecipar capacidades sem simular uma ação funcional;
- escolhas dentro do descanso atualizam somente o próprio diálogo, preservando a ficha ao fundo e evitando flashes causados por uma remontagem completa.
- quando houver cartas no Vault, o descanso começa com a organização opcional do Loadout. Essa etapa não consome movimento, mantém no máximo cinco cartas ativas e só persiste sua composição junto da confirmação final do descanso.
- o editor visual de Loadout usa cinco espaços com miniatura e uma grade rolável para o Vault. Arrastar é a interação principal, mas cada carta ativa preserva controles de teclado para mudar de posição ou retornar ao Vault; o detalhe integral abre sobre a etapa, sem descartá-la.
- a prévia de importação diferencia Packs novos de atualizações e mostra a transição de versão antes da confirmação.
- na ficha, a forma assumida usa o selo contextual da transformação; no detalhe, ancestralidade e Feature formam um painel próprio, visualmente separado das regras gerais.

### Cicatrizes e Esperança

- a entrada compacta exibe somente “Cicatrizes” junto ao recurso Esperança; quando houver alguma, seu nome acessível informa quantidade e redução do limite;
- o painel apresenta a equação entre limite sem Cicatrizes, quantidade e limite atual antes do formulário narrativo;
- a perda do último espaço recebe alerta explícito, sem bloquear a decisão; quando o limite chega a zero, novas Cicatrizes ficam indisponíveis;
- remover uma Cicatriz é uma decisão atribuída ao mestre e exige confirmação que informa a restauração de um slot.

### Seleções com representação visual

- a seleção de personagens prioriza retrato, nome, classe, ancestralidade e nível; dados de sessão e recursos pertencem à ficha aberta;
- quando não houver retrato, use o símbolo neutro do SoulForge, evitando confundi-lo com brasões de classe;
- escolhas mutuamente exclusivas, como subclasses ou o momento de ativar uma carta, usam abas ou opções visuais com estado selecionado explícito;
- trocas entre coleções mostram o item de entrada, o item de saída, o custo e um resumo antes de liberar a confirmação.

## Primitives de interface

Controles repetidos devem usar as primitives abaixo. Elas representam a intenção da ação, não a área da tela onde aparecem, para que uma alteração visual seja refletida de forma consistente em todo o SoulForge.

### Busca

- use `sf-search-field` em todo campo de pesquisa;
- a classe define ícone, espaçamento, borda, fundo e comportamento responsivo;
- filtros complementares, como Pack, ficam em controles separados e não reduzem a largura do campo de busca principal.

### Filtros

- use `sf-filter-option` em filtros compactos de categoria, domínio e nível;
- o estado ativo usa a mesma névoa discreta da navegação superior, sem transformar o filtro em um botão pesado;
- filtros de nível exibem o rótulo `Nível` uma vez e usam valores curtos (`Todos`, `1`, `2`...), preservando a leitura em tablet.

### Navegação e ajustes incrementais

- use `sf-tab` para uma escolha de navegação ou filtro que tenha estado ativo persistente; ela reaproveita a névoa localizada da ficha;
- use `sf-stepper-button` para aumentar ou reduzir um valor em um passo. O botão mantém forma circular, contraste e área de toque adequados;
- não use `sf-stepper-button` para uma ação destrutiva ou irreversível.

### Ações

- `sf-action sf-action--primary`: confirmar, criar, salvar, aplicar ou avançar um fluxo;
- `sf-action sf-action--secondary`: cancelar, voltar, alterar ou executar uma ação neutra;
- `sf-action sf-action--danger`: excluir, descartar ou remover dados;
- `sf-action--icon`: versão de ícone para ações com rótulo acessível (`aria-label` e `title`);
- `sf-action--compact`: reservada a ações densas de barras, cabeçalhos e listas, quando necessária.

As classes históricas `primary-action`, `secondary-action`, `danger-action` e `search-box` permanecem como aliases de compatibilidade. Toda interface nova ou revisada deve usar as classes `sf-*`; qualquer área antiga identificada deve ser migrada junto da alteração funcional que a tocar.

### Superfícies de modal

- todo modal deve ser aberto dentro de `modal-backdrop`; o backdrop aplica a camada de foco e o desfoque discreto;
- a superfície do modal usa raio, sombra e animação de entrada comuns; cabeçalho e rodapé não devem se mover conforme o conteúdo do corpo muda;
- a animação é exclusivamente de opacidade e transformação e é reduzida quando o sistema solicita menos movimento.

## Estados de interface

- vazios usam `sf-state sf-state--empty`; em regiões compactas, acrescente `sf-state--inline` e informe a próxima ação possível;
- erros de validação usam `form-error`, texto objetivo e o campo inválido marcado com `is-invalid`; a mensagem deve explicar como corrigir o problema;
- controles indisponíveis permanecem legíveis, mas com contraste reduzido e cursor de bloqueio. Não use apenas opacidade para comunicar a causa: o contexto próximo deve informar a regra ou o requisito faltante;
- estados bloqueados mantêm um rótulo textual, como `BLOQUEADA — TIER 3`, além da diferença visual;
- carregamento usa `sf-state--loading` e texto de status. Não use animação intensa nem bloqueie a leitura de conteúdo já disponível.

### Escolhas de cartas com detalhe

- selecionar uma carta e abrir seu efeito completo são ações independentes;
- a carta selecionada exibe selo textual com ícone de confirmação, além do
  controle explícito para remover a seleção; abrir ou fechar detalhes nunca
  altera essa escolha;
- a criação resume todas as cartas escolhidas, inclusive as filtradas em outro
  Domínio. A progressão mantém um resumo da única carta selecionada ao trocar
  filtros;
- em grades de duas colunas, uma carta com detalhes abertos ocupa a linha
  inteira. A lista rola, mas nenhuma carta pode encolher abaixo de seu conteúdo.

## Fluxos guiados

Criação de personagem, progressão e descanso apresentam uma decisão por vez e compartilham o mesmo contrato visual: indicador de etapa no topo, título estável, corpo rolável sem deslocar o cabeçalho e ações previsíveis no rodapé. Áreas internas que possam exceder a altura disponível usam `sf-scroll-region`, preservando uma pista de rolagem visível no tema escuro.

### Distribuição inicial de atributos

- a interação começa pelo atributo e somente então oferece os valores que ele
  pode receber; a pedra nunca precisa ser selecionada antes de seu destino;
- o seletor permanece aberto depois da atribuição para permitir revisão, troca
  e mudança direta para outro atributo sem esconder o estado atual;
- progresso, atributo ativo, pedras e ações formam uma única faixa integrada,
  separada apenas por espaço e linhas discretas. Contornos fortes ficam
  reservados à pedra atual e ao foco de teclado;
- cada pedra conserva uma identidade transitória, inclusive os valores `0` e
  `+1` repetidos, enquanto textos distinguem **Disponível**, **Valor atual** e
  o atributo em que uma pedra já está encaixada;
- remover uma atribuição exige **Liberar valor**. Tocar novamente no cartão ou
  no valor atual não executa uma ação destrutiva. **Liberar valor** e
  **Recomeçar distribuição** são ações textuais, não novos painéis;
- a interação principal é clique, toque ou teclado, com alvos mínimos de 44 px.
  Drag-and-drop não é requisito nem alternativa exclusiva;
- a grade usa três colunas em desktop e iPad horizontal e duas em larguras
  menores. O corpo continua rolável sempre que painel e cartões excederem a
  altura disponível.

## Compendium

O Compendium usa uma metáfora leve de livro de consulta. Em paisagem, apresenta duas páginas por abertura; em larguras menores, organiza essas páginas em sequência vertical. Detalhes completos estão em [COMPENDIUM.md](COMPENDIUM.md).
