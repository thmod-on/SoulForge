# Backlog do SoulForge

Última revisão: 21 de setembro de 2026.

## Objetivo

Este documento concentra trabalho conhecido que foi adiado, depende de uma
decisão futura ou precisa ser confirmado antes de ser considerado concluído.

Os documentos de arquitetura e domínio continuam sendo os contratos do
projeto. O backlog não substitui esses documentos e não autoriza exceções aos
pilares definidos em [Contexto de desenvolvimento](CODEX_CONTEXT.md).

## Como manter

Cada item deve possuir um identificador estável, prioridade, estado, origem e
critério de conclusão. Ao encontrar uma nova pendência:

1. confirmar que ela ainda não foi resolvida pelo código ou pelo changelog;
2. registrar o resultado esperado, sem antecipar uma solução técnica;
3. apontar o documento que originou ou restringe o trabalho;
4. atualizar o estado durante a implementação;
5. mover o item para **Concluídos** na mesma entrega que o resolver.

Prioridades:

- **P0 — crítica:** perda de dados, quebra de contrato ou impedimento de release;
- **P1 — alta:** segurança, compatibilidade ou documentação enganosa;
- **P2 — normal:** evolução importante sem bloqueio imediato;
- **P3 — futura:** melhoria válida cuja necessidade ainda não é urgente.

Estados:

- **Pronto:** escopo suficientemente definido para implementação;
- **A definir:** requer decisão de produto ou domínio;
- **Condicional:** executar somente quando o gatilho indicado ocorrer;
- **Em andamento:** existe implementação ativa ainda não concluída;
- **Bloqueado:** depende de informação ou evento externo identificado.

## Pendências ativas

Os itens desta revisão tiveram origem nos testes de mesa de 12 de setembro, nas
revisões de produto dos dias 13 e 14 e na revisão do descanso de 19 de setembro.

| ID | Prioridade | Estado | Área | Pendência | Critério de conclusão |
| --- | --- | --- | --- | --- | --- |
| CRI-001 | P2 | Pronto | Criação de personagem | Exibir as Features Top e Bottom de cada ancestralidade durante a própria escolha da ancestralidade, antes da etapa seguinte. | Cada opção permite consultar nome e descrição das duas Features sem sair da etapa; a visualização funciona por clique, toque e teclado, preserva a seleção atual e deixa clara a origem de cada Feature ao combinar duas ancestralidades, sem duplicar nem substituir a etapa posterior de definição de Top e Bottom. |
| ITM-001 | P3 | A definir | Itens e Packs | Confirmar se Ração e Cantil pertencem ao conteúdo Core antes de adicioná-los ao catálogo. | Fonte e classificação confirmadas; se oficiais, entram no Pack correspondente com referência revisada; se forem apenas equipamento mundano desejado pelo SoulForge, entram em conteúdo local ou compartilhado sem atribuição oficial indevida. |
| CND-001 | P1 | Pronto | Ficha e Condições | Permitir que a personagem receba, consulte e remova Condições por meio de indicadores visuais compactos. | A ficha persiste referências às Condições e mostra um token acessível com nome e arte ou placeholder; clicar ou tocar abre o detalhe; aplicação e remoção manual são possíveis; origens e encerramentos independentes não duplicam o token nem removem prematuramente uma Condição ainda ativa; Pack ausente preserva a referência. Ao marcar o último Estresse, Vulnerável é aplicada automaticamente pela origem `stress` e, ao limpar ao menos 1 Estresse, somente essa origem é encerrada. |
| RSC-001 | P2 | Pronto | Ficha e Recursos | Permitir remover recursos customizados da personagem. | Somente recursos criados pela pessoa usuária podem ser removidos; recursos essenciais ou derivados permanecem protegidos; a interface identifica claramente o recurso, pede confirmação, persiste a exclusão e trata referências associadas sem deixar estado órfão. |
| COM-001 | P1 | A definir | Comunidades e Packs | Confirmar o comportamento ao remover ou atualizar um Pack cuja comunidade é usada por personagens. | Regra de domínio documentada, interface coerente, dados antigos preservados ou migrados explicitamente e testes cobrindo remoção e atualização. |
| COM-002 | P1 | Pronto | Comunidades | Completar a matriz de compatibilidade: Pack ausente, comunidade local, comunidade importada e ficha legada. | Cenários automatizados ou justificados como validação manual, todos com resultado esperado registrado. |
| COM-003 | P2 | Pronto | Comunidades | Validar o fluxo de criação e a ficha em desktop e iPad horizontal. | Criação, consulta e reabertura verificadas nas duas disposições sem corte, perda de contexto ou alvo de toque inadequado. |
| EFF-001 | P1 | Pronto | Efeitos | Atualizar a auditoria de classes e efeitos para distinguir lacunas resolvidas das ainda abertas. | A cobertura descrita coincide com os tipos, Packs locais e testes atuais. |
| EFF-002 | P2 | A definir | Efeitos | Suportar modificadores temporários simples de Proficiência e atributos. | Novo contrato declarativo documentado e interpretado genericamente, sem conhecimento de classe na Engine. |
| EFF-003 | P3 | A definir | Efeitos | Modelar estados associados a alvo e gatilhos explícitos de ataque ou dano quando houver interação visível para o jogador. | Contrato independente de texto livre, persistência definida e encerramento previsível dos efeitos. |
| EFF-004 | P2 | A definir | Efeitos | Conectar encerramentos já declarados que ainda dependem de ação manual, como dano severo e próximo ataque bem-sucedido. | Fluxos de dano e ataque produzem eventos explícitos e encerram somente os efeitos correspondentes. |
| MRK-001 | P2 | A definir | Marcadores | Representar reinicialização por qualquer descanso, distinta de descanso breve ou longo. | Contrato documentado, formulário de autoria atualizado e reinicialização coberta por testes. |
| MRK-002 | P2 | A definir | Marcadores | Permitir quantidades dinâmicas com mínimo ou derivadas de conjuntos conhecidos, como cartas de um Domínio no Loadout e Vault. | Fórmulas necessárias são declarativas, determinísticas e testadas sem consultas a texto descritivo. |
| MRK-003 | P3 | A definir | Marcadores | Avaliar contagem regressiva, cooldown temporal e outros controles ainda não modelados. | Cada novo tipo possui caso real, regra de persistência e interação definida antes de alterar o domínio. |
| RST-001 | P3 | A definir | Descanso | Criar acompanhamento de Projetos para o movimento de descanso longo “Trabalhar em projeto”. | Modelo, progresso, persistência e interface documentados; a ação deixa de ser apenas narrativa. |
| TRN-004 | P2 | A definir | Transformações e Efeitos | Definir como Features assumidas pelo Metamorfo podem conceder efeitos mecânicos, mantendo `application: "reference"` apenas informativo. O Transe Celestial é o primeiro caso conhecido: atualmente concede movimento adicional somente quando pertence à ancestralidade real da personagem. | Um modo de aplicação mecânica explícito distingue referência de Feature ativa; define quais modificadores, marcadores, custos e ativações podem ser herdados com segurança; aplica e remove os efeitos ao trocar de forma sem duplicar estado; cobre Transe Celestial e ao menos um segundo tipo de efeito em testes; documentação e compatibilidade com Packs ausentes são atualizadas. |
| CMP-002 | P3 | Condicional | Compendium | Avaliar um capítulo próprio para Features. | Implementar somente quando existirem conteúdo e fluxos suficientes para justificar o capítulo separado. |
| ART-001 | P1 | Condicional | Artes | Criar manifesto de artes e verificador automatizado antes de ultrapassar 40 imagens incorporadas. | Build valida ID, caminho, dimensões, formato, peso e associação de cada arte. Gatilho: lote que levaria o projeto além de 40 imagens. |
| ART-002 | P2 | Pronto | Artes | Padronizar geração de WebP e miniaturas em script reproduzível. | Um comando documentado gera os formatos de entrega sem edição manual obrigatória. |
| ART-003 | P2 | Condicional | Artes e PWA | Medir memória, carregamento, rolagem no iPad e reutilização do cache sob demanda após lotes relevantes. | Resultados registrados e limites da política revistos quando necessário. Gatilho: conclusão de um lote relevante. |
| PWA-001 | P1 | Pronto | PWA | Executar a matriz manual de release: instalação no iPad, reabertura offline, atualização do Service Worker e preservação de dados locais. | Evidências da versão registradas antes da publicação ou impedimentos explicitamente aceitos. |
| ARC-001 | P2 | Condicional | Arquitetura | Continuar reduzindo as renderizações e templates legados de `main.ts` sem criar abstrações preventivas. | Cada área tocada transfere responsabilidades completas para sua feature e a barreira arquitetural não aumenta. Gatilho: alteração funcional na área correspondente. |
| UI-001 | P3 | Condicional | Interface | Substituir aliases históricos de ações e pesquisa pelas primitives `sf-*`. | Área revisada usa somente as primitives atuais sem regressão visual. Gatilho: alteração funcional na área. |

## Limitações deliberadas — não tratar como pendência automática

Os pontos abaixo só devem entrar nas pendências ativas após uma decisão
explícita de produto:

- login, servidor próprio e sincronização em nuvem;
- automação integral de ataques, rolagens, dano, decisões do GM e efeitos em
  criaturas ou aliados;
- inferência de regras a partir de nomes, descrições ou outros textos livres;
- conteúdo oficial sem fonte disponível e permissão de distribuição confirmada;
- mais de uma comunidade mecânica ou transformação por personagem;
- pacotes visuais opcionais antes de o volume justificar o Estágio 3 da política
  de artes.

## Concluídos

Itens concluídos devem permanecer nesta seção somente enquanto forem úteis para
rastreabilidade. O changelog continua sendo o histórico definitivo das entregas.

| ID | Conclusão | Resultado |
| --- | --- | --- |
| DOC-001 | 10/09/2026 · `0.26.19` | README, PWA, Packs, Compendium, progressão, ancestralidades, comunidades, marcadores e auditoria de efeitos reconciliados com o código e o changelog. Orientações antigas da interface também foram corrigidas. |
| UI-002 | 10/09/2026 · `0.26.19` | Criação por classe ganhou estandarte e abas de subclasse; seleção de personagens virou galeria responsiva; troca Vault→Loadout recebeu confirmação em duas etapas; e cartas ativas passaram a usar trilho horizontal em containers estreitos. Padrões e testes correspondentes foram registrados. |
| UI-003 | 13/09/2026 · `0.27.0` | Vault passou a usar cartões de altura uniforme, títulos e resumos limitados, grade específica por largura e ação integrada de 48 px para mover ao Loadout. Validado em iPad horizontal (3 colunas), iPad vertical (2), desktop (4) e celular (1). |
| NAV-001 | 13/09/2026 · `0.27.0` | A navegação delegada passou a reconhecer cliques originados em botões, `span`, `svg` e `path`; Compendium e Configurações mantêm destinos independentes e alvos mínimos de 44 × 44 px na ficha. Fluxos da ficha, seleção e editor foram validados no navegador e cobertos por testes. |
| PRG-001 | 13/09/2026 · `0.27.0` | Aprimoramento da subclasse e Multiclasse passaram a se bloquear mutuamente dentro do mesmo Tier, consultando o rascunho e `advancementSelections` persistidas. A interface desabilita a escolha conflitante após reabrir a ficha e a aplicação rejeita estados inválidos antes de salvar. |
| PRG-002 | 13/09/2026 · `0.27.0` | Todas as opções de progressão passaram a exibir antecipadamente `Custo: 1 avanço` ou `Custo: 2 avanços`; Proficiência e Multiclasse recebem destaque de custo integral e, sem saldo suficiente, explicam quantos avanços exigem e quantos restam. A etapa, o resumo e o modal de Multiclasse usam “avanços” de forma consistente. |
| CRD-001 | 13/09/2026 · `0.27.0` | O detalhe de uma carta passou a exibir apenas o efeito completo, sem repetir o resumo compacto. Cartas antigas sem `effect` usam o `summary` como “Descrição”, enquanto Vault, Loadout e listagens continuam apresentando seus resumos. |
| UI-004 | 13/09/2026 · `0.27.0` | O carrossel do Loadout passou a guardar o deslocamento horizontal e a carta que abriu o detalhe por personagem. A posição é restaurada após qualquer nova renderização, limitada à largura atual; ao fechar por botão, fundo ou `Esc`, o foco retorna à carta e os controles anterior/próximo são recalculados. |
| RST-002 | 13/09/2026 · `0.27.0` | Toda a nomenclatura visível do fluxo passou a usar “Descanso” e “movimento de descanso” no atalho da ficha, modal, textos acessíveis, histórico e documentação de uso. IDs, tipos e contratos internos de `rest` foram preservados sem migração de fichas. |
| CRD-002 | 13/09/2026 · `0.27.0` | Cartas do Loadout podem ser desativadas até o próximo descanso, descanso longo, nova sessão ou reativação manual. O estado pertence ao `Character.deck`; a carta permanece clicável como verso identificado pelo nome e pelo símbolo ampliado do SoulForge, deixa de fornecer marcadores e bônus passivos e retorna somente no evento escolhido. Importação, progressão e trocas com o Vault preservam a consistência desse estado. |
| TRN-001 | 10/09/2026 · `0.26.20` | Personagens passaram a referenciar uma única transformação persistente, com concessão, substituição, remoção, estado de Pack ausente, apresentação fora do limite do Loadout e marcadores declarativos cobertos por testes. |
| TRN-003 | 14/09/2026 · `0.28.0` | As seis transformações de Hope & Fear foram auditadas contra as páginas 41–44 do SRD 2.0. O Pack local `1.1.0-local` restaura Features completas, valores, alcances, custos, gatilhos, encerramentos e as seis perguntas narrativas de cada entrada; seu gerador valida essas invariantes e Compendium e ficha têm cobertura para a exibição integral. |
| CLS-002 | 14/09/2026 · `0.28.0` | O detalhe da classe aberto pela ficha passou a mostrar Evasão inicial e PV inicial declarados pela classe, sem misturá-los com os valores atuais da personagem. Fichas legadas localizam a Definition pelo nome e a ausência do Pack recebe uma explicação explícita. |
| CMP-001 | 14/09/2026 · `0.28.0` | O Compendium ganhou um capítulo próprio e pesquisável para Condições, com criação, edição e exclusão local, detalhe de efeito e encerramento, identificação da fonte e estado vazio para Pack ausente. O contrato `ConditionDefinition` e a validação de Packs cobrem condições padrão e especiais; o Pack local `Core - Condições` reúne Oculto, Restringido e Vulnerável conforme o SRD 2.0. Artes autorais são resolvidas pelos IDs exatos dessas três condições na miniatura e no detalhe, sem antecipar os tokens da ficha. |
| NOT-001 | 15/09/2026 · `0.29.0` | Novas anotações usam Lore no lugar de Item. Fichas locais e arquivos importados migram notas antigas preservando identificador, título, conteúdo e datas; filtros e detalhes apresentam o novo rótulo. |
| TRN-002 | 15/09/2026 · `0.29.0` | Transformações passaram a declarar mutações de marcador, escolhas por referência e ações de descanso sem interpretação de texto. Sangue do Vampiro diminui no descanso longo; o Metamorfo escolhe forma e Feature no descanso e as destaca na ficha; ações indisponíveis continuam visíveis e explicativas. |
| CHR-001 | 15/09/2026 · `0.29.0` | Cicatrizes passaram a guardar lembrete narrativo e data na ficha, com indicador compacto junto à Esperança e painel de gestão. O limite máximo é derivado do limite-base, bônus ativos e quantidade de Cicatrizes, sem perdas cumulativas; remover uma Cicatriz mediante confirmação restaura exatamente um slot e a interface alerta antes de perder o último. |
| ATR-001 | 15/09/2026 · `0.30.0` | Os seis brasões de atributo da ficha passaram a ser controles acessíveis por clique, toque, Enter e Espaço. O detalhe preserva o contexto da ficha e apresenta valor atual, verbos de referência e estados como Aprimorado ou Atributo de Conjuração, sem oferecer edição. |
| ITM-002 | 21/09/2026 · `0.32.0` | Os Packs locais de itens foram auditados contra o SRD 2.0 e receberam um vocabulário documentado. `Gambeson` virou Gibão; falsos cognatos e traduções incompletas foram corrigidos; qualificadores de Tier passaram a respeitar posição, gênero e número em português e os termos oficiais em inglês. Os 633 IDs existentes permaneceram inalterados. |
| CLS-001 | 21/09/2026 · `0.32.0` | Features agora podem declarar campos genéricos persistentes, preenchidos na criação e editados numa seção própria de Aptidões. O contrato estreia com Patrono e esfera do Bruxo, elemento da Origem Elemental e número de Padrões Estranhos do Mago, sem regras condicionadas ao nome de uma classe. |

## Referências

- [Contexto de desenvolvimento](CODEX_CONTEXT.md)
- [Arquitetura](ARCHITECTURE.md)
- [Modelo de domínio](DOMAIN_MODEL.md)
- [Behaviors](DOMAIN_BEHAVIORS.md)
- [Comunidades](COMMUNITIES.md)
- [Transformações](TRANSFORMATIONS.md)
- [Condições](CONDITIONS.md)
- [Auditoria de classes e efeitos](CLASS_EFFECTS_AUDIT.md)
- [Revisão de marcadores de cartas](GAME_MARKER_REVIEW.md)
- [Política de artes e assets visuais](ASSET_POLICY.md)
- [Vocabulário de itens](ITEM_TRANSLATIONS.md)
- [Campos de personagem das Features](FEATURE_FIELDS.md)
- [PWA e uso offline](PWA_OFFLINE.md)
- [Padrões de interface](UI_PATTERNS.md)
