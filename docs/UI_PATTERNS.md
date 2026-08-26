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

Consulte também [UX_GUIDELINES.md](UX_GUIDELINES.md).

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

### Escolhas com detalhe

- quando uma opção precisa revelar texto complementar, a opção selecionada deve expandir no próprio card;
- use o estado `is-selected is-focused` para que apenas uma opção revele o detalhe por vez;
- não crie um painel separado abaixo da lista quando a informação explica diretamente a escolha feita; isso evita deslocamentos e rolagem de ida e volta em tablet.

## Fluxos guiados

Criação de personagem, progressão e downtime apresentam uma decisão por vez e compartilham o mesmo contrato visual: indicador de etapa no topo, título estável, corpo rolável sem deslocar o cabeçalho e ações previsíveis no rodapé. Áreas internas que possam exceder a altura disponível usam `sf-scroll-region`, preservando uma pista de rolagem visível no tema escuro.

## Compendium

O Compendium usa uma metáfora leve de livro de consulta. Em paisagem, apresenta duas páginas por abertura; em larguras menores, organiza essas páginas em sequência vertical. Detalhes completos estão em [COMPENDIUM.md](COMPENDIUM.md).
