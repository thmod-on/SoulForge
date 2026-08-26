# Identidade visual do SoulForge

## Propósito

O SoulForge é um companheiro de mesa para Daggerheart. Sua interface deve ser rápida de consultar, confortável em iPad na horizontal e visualmente evocativa sem competir com a sessão de jogo.

A direção de arte é **fantasia sombria refinada**: superfícies profundas, contraste legível, detalhes arcanos pontuais e movimento discreto.

## Princípios

1. **Leitura antes de decoração.** Informação de jogo, estado e ação precisam ser compreendidos sem depender de ilustrações ou de cor isolada.
2. **Uma cor, uma intenção.** A cor de ação não é usada para recursos, alertas ou estados destrutivos.
3. **Foco sem excesso.** Bordas, brilhos e névoa aparecem para seleção, foco ou ações relevantes; não como moldura de toda a tela.
4. **Toque primeiro.** Controles têm área suficiente para iPad e feedback imediato de pressão, foco e indisponibilidade.
5. **Movimento explica.** Transições servem para orientar mudança de contexto, revelar hierarquia ou confirmar uma ação.

## Tokens visuais

| Token | Valor inicial | Uso |
| --- | --- | --- |
| `--color-bg` | `#080511` | fundo global |
| `--color-panel` | `rgba(12, 8, 20, 0.78)` | superfícies principais |
| `--color-text` | `#f4eadb` | texto principal |
| `--color-muted` | `#c8b8a6` | texto de apoio |
| `--color-action` | `#c39bff` | confirmar, salvar, seleção e foco |
| `--color-action-hover` | `#dec8ff` | interação direta e foco reforçado |
| `--color-action-soft` | `rgba(195, 155, 255, 0.12)` | seleção discreta e fundos ativos |
| `--color-fear` | `#c92e42` | PV, risco, erro e exclusão |
| `--color-essence` | `#8e4fc4` | Essência e informação arcana própria |
| `--color-hope` | `#f3eadc` | Esperança e marfim de alto contraste |

O antigo token `--color-gold` existe apenas como alias de compatibilidade para `--color-action`. Todo CSS novo deve usar o token semântico correto.

## Contrato dos componentes

### Ações

- `sf-action--primary`: criar, salvar, confirmar, aplicar, concluir ou avançar; usa ametista preenchida de forma contida.
- `sf-action--secondary`: cancelar, voltar, alterar ou ações neutras; usa a superfície neutra e não disputa atenção com a ação primária.
- `sf-action--danger`: excluir, descartar ou remover; usa vermelho e pede confirmação quando houver perda de dados.
- `sf-action--icon`: só é permitido com `aria-label` e `title`.

### Campos e filtros

Campos de texto, seleção e busca usam superfície escura uniforme, borda neutra e foco ametista. Filtros ativos usam a mesma névoa curta da navegação da ficha. Estados não podem depender só de cor: devem ter texto, borda, ícone ou outra diferença perceptível.

### Cards

Cards são superfícies de leitura. Por padrão, usam borda discreta. A seleção recebe ametista e uma leve elevação/névoa; bloqueio reduz contraste e mantém uma etiqueta textual clara.

### Modais

- backdrop escuro e desfoque leve;
- título e fechar sempre visíveis;
- rolagem fica no corpo quando o conteúdo exceder o espaço;
- ações relevantes podem permanecer no rodapé do modal;
- clique fora não fecha formulários com conteúdo em edição;
- ações destrutivas pedem confirmação explícita.

## Movimento e acessibilidade

| Token | Duração | Uso |
| --- | --- | --- |
| `--motion-fast` | 140 ms | foco, filtros, botões |
| `--motion-standard` | 200 ms | cards e modais |
| `--motion-emphasis` | 280 ms | transições de contexto futuras, quando forem justificadas |

Use preferencialmente `opacity` e `transform`; não anime dimensões, posição de layout ou filtros pesados. O projeto respeita `prefers-reduced-motion`, que reduz transições e animações ao mínimo.

## Imagens e assets

As imagens são opcionais e ficam apenas no dispositivo quando forem enviadas pelo usuário. Um conteúdo sem imagem deve continuar legível e reconhecível pelo nome, tipo e fallback visual.

| Uso | Proporção de referência | Encaixe | Fallback |
| --- | --- | --- | --- |
| Retrato de personagem | 3:4 | `cover` na sidebar; visualização completa no modal | área abstrata da ficha, sem ilustração inventada |
| Carta | 2:3 | `cover` em miniatura; `contain` no detalhe | gradiente arcano do domínio |
| Item | 4:3 ou objeto isolado | `contain`, sem cortar a peça | sigla de categoria (`WPN`, `ARM`, etc.) |
| Classe, ancestralidade e comunidade | quadrada ou 4:3 | `cover` em lista e detalhe | símbolo discreto de categoria |

- os uploads locais aceitam apenas PNG, JPEG e WebP, até 1,5 MB; a validação é centralizada em `src/app/media.ts`;
- usar WebP quando for possível exportar o asset; SVG é indicado para ícones e nunca para arte oficial incorporada;
- ilustrações são apoio, nunca a única forma de comunicar uma regra;
- não adicionar arte oficial sem autorização de uso e distribuição;
- não buscar imagens externas em tempo de execução: a ficha deve permanecer offline;
- autores de packs devem preferir imagem ausente a um link remoto ou a um asset sem autorização. O fallback sem imagem faz parte do produto.

### Texturas de atmosfera

`public/assets/textures/sheet-slate.webp` e `public/assets/textures/compendium-parchment.webp` são os assets abstratos ativos, locais e sem conteúdo de jogo. Seus caminhos são centralizados nos tokens `--texture-sheet` e `--texture-compendium`. A textura azul-ardósia fica na entrada da aplicação, no Vault e em painéis de arte vazios; a de pergaminho violeta fica apenas nas páginas do Compendium. Não devem ser usados em controles, textos, cards pequenos ou como substitutos de uma imagem de conteúdo.

## Adoção

1. Aplicar tokens e primitives globais. **Concluído.**
2. Revisar a ficha do jogador como tela-piloto. **Concluído.**
3. Migrar o Compendium por área funcional. **Concluído para índices, buscas, filtros, ações e modais.**
4. Migrar Configurações por seção, preservando as escolhas e a persistência atuais. **Concluído para ações, importação e confirmação de remoção.**
5. Aplicar as primitives aos fluxos guiados. **Concluído para criação de personagem, progressão e downtime; etapas, ações e rolagem usam os mesmos contratos.**
6. Migrar a ficha e as superfícies de apoio restantes. **Concluído para seleção de personagem, Traços, Inventário, Anotações e modais genéricos.**
7. Padronizar estados de vazio, bloqueio, indisponibilidade, erro e carregamento. **Concluído para os componentes-base e mensagens reutilizáveis.**
8. Auditar o comportamento de modais em iPad. **Concluído para margem segura, altura responsiva, rolagem interna e alvos de toque.**
9. Adicionar animações especiais somente após a interface base estar estável. A troca de abertura do Compendium permanece instantânea até existir um efeito que preserve simultaneamente a página anterior e a próxima, sem comprometer rolagem ou leitura.
