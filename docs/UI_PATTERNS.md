# Padrões de interface

## Contexto de uso

O SoulForge prioriza tablet em paisagem, especialmente iPad, e deve se comportar bem em desktop. Celular não é o foco inicial.

A interface favorece leitura rápida e ações de sessão em tela única, evitando a aparência excessiva de páginas de site empilhadas em cartões.

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

O modal deve ter título, ação de fechar, fechamento por `Escape` quando houver teclado e clique fora quando isso não comprometer um formulário em andamento.

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

## Compendium

O Compendium usa uma metáfora leve de livro de consulta. Em paisagem, apresenta duas páginas por abertura; em larguras menores, organiza essas páginas em sequência vertical. Detalhes completos estão em [COMPENDIUM.md](COMPENDIUM.md).
