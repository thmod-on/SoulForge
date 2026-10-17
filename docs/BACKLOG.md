# Backlog do SoulForge

Última revisão: 17 de outubro de 2026.

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

Os itens desta revisão tiveram origem nos testes de mesa de setembro, nas
revisões de produto e na auditoria operacional da hospedagem Cloudflare de 10
de outubro de 2026.

| ID | Prioridade | Estado | Área | Pendência | Critério de conclusão |
| --- | --- | --- | --- | --- | --- |
| ITM-001 | P3 | A definir | Itens e Packs | Confirmar se Ração e Cantil pertencem ao conteúdo Core antes de adicioná-los ao catálogo. | Fonte e classificação confirmadas; se oficiais, entram no Pack correspondente com referência revisada; se forem apenas equipamento mundano desejado pelo SoulForge, entram em conteúdo local ou compartilhado sem atribuição oficial indevida. |
| CLS-003 | P1 | Pronto | Classes e Packs | Auditar as Features de todas as classes e subclasses locais contra a fonte oficial vigente. O primeiro defeito confirmado é no Mago: Padrões Estranhos duplica a descrição de Prestidigitação antes de sua própria regra do Dado de Dualidade. | As 13 classes e 26 subclasses têm Features conferidas contra fonte oficial identificada por versão e data; cada texto contém somente sua própria regra, sem parágrafos ausentes ou duplicados; escolhas persistentes e metadados mecânicos correspondem à Feature revisada; Packs são regenerados, importáveis e cobertos por testes de conteúdo. |
| COM-001 | P1 | A definir | Comunidades e Packs | Confirmar o comportamento ao remover ou atualizar um Pack cuja comunidade é usada por personagens. | Regra de domínio documentada, interface coerente, dados antigos preservados ou migrados explicitamente e testes cobrindo remoção e atualização. |
| COM-003 | P2 | Pronto | Comunidades | Validar o fluxo de criação e a ficha em desktop e iPad horizontal. | Criação, consulta e reabertura verificadas nas duas disposições sem corte, perda de contexto ou alvo de toque inadequado. |
| EFF-002 | P2 | A definir | Efeitos | Suportar modificadores temporários simples de Proficiência e atributos. | Novo contrato declarativo documentado e interpretado genericamente, sem conhecimento de classe na Engine. |
| EFF-003 | P3 | A definir | Efeitos | Modelar estados associados a alvo e gatilhos explícitos de ataque ou dano quando houver interação visível para o jogador. | Contrato independente de texto livre, persistência definida e encerramento previsível dos efeitos. |
| EFF-004 | P2 | A definir | Efeitos | Conectar encerramentos já declarados que ainda dependem de ação manual, como dano severo e próximo ataque bem-sucedido. | Fluxos de dano e ataque produzem eventos explícitos e encerram somente os efeitos correspondentes. |
| MRK-002 | P2 | A definir | Marcadores | Permitir quantidades dinâmicas com mínimo ou derivadas de conjuntos conhecidos, como cartas de um Domínio no Loadout e Vault. | Fórmulas necessárias são declarativas, determinísticas e testadas sem consultas a texto descritivo. |
| MRK-003 | P3 | A definir | Marcadores | Avaliar contagem regressiva, cooldown temporal e outros controles ainda não modelados. | Cada novo tipo possui caso real, regra de persistência e interação definida antes de alterar o domínio. |
| TRN-004 | P2 | A definir | Transformações e Efeitos | Definir como Features assumidas pelo Metamorfo podem conceder efeitos mecânicos, mantendo `application: "reference"` apenas informativo. O Transe Celestial é o primeiro caso conhecido: atualmente concede movimento adicional somente quando pertence à ancestralidade real da personagem. | Um modo de aplicação mecânica explícito distingue referência de Feature ativa; define quais modificadores, marcadores, custos e ativações podem ser herdados com segurança; aplica e remove os efeitos ao trocar de forma sem duplicar estado; cobre Transe Celestial e ao menos um segundo tipo de efeito em testes; documentação e compatibilidade com Packs ausentes são atualizadas. |
| ART-001 | P1 | Condicional | Artes | Criar manifesto de artes e verificador automatizado antes de ultrapassar 40 imagens incorporadas. | Build valida ID, caminho, dimensões, formato, peso e associação de cada arte. Gatilho: lote que levaria o projeto além de 40 imagens. |
| ART-003 | P2 | Condicional | Artes e PWA | Medir memória, carregamento, rolagem no iPad e reutilização do cache sob demanda após lotes relevantes. | Resultados registrados e limites da política revistos quando necessário. Gatilho: conclusão de um lote relevante. |
| ART-004 | P2 | A definir | Artes e fluxo de autoria | Criar um comando de preparação de arte orientado pelo ID estável de uma Definition. A pessoa usuária solicita a arte em linguagem natural; após a imagem-mestre ser aprovada, o comando recebe somente o ID e a origem, define os caminhos adequados, gera detalhe e miniatura WebP e valida a entrega. | O fluxo não exige que a pessoa usuária informe caminhos, dimensões ou formato; o ID é validado contra o catálogo e determina tipo/coleção e destinos; a ferramenta reutiliza ART-002, impede sobrescrita acidental sem confirmação, informa os arquivos gerados e não altera a Definition, associação visual ou Pack sem ação explícita posterior. |
| CLD-006 | P1 | Pronto | Cloudflare e recuperação | Formalizar recuperação e limpeza operacional sem comprometer dispositivos offline. | Runbook documenta consulta e restauração pelo D1 Time Travel; tarefa diária remove sessões expiradas e mídias sem referência há mais de 24 horas; `sync_changes` e tombstones não são podados até existir política segura de cursores. |
| CLD-007 | P1 | Pronto | Cloudflare e migração | Concluir a mudança de origem do GitHub Pages para o Worker. | O endereço antigo exibe aviso, link oficial e instruções de backup/restauração durante 30 dias; após validação da janela, o workflow e o GitHub Pages são desativados em 9 de novembro de 2026. |
| CLD-008 | P2 | Pronto | Cloudflare e ambientes | Criar ambiente de preview isolado da produção. | Worker, D1 e R2 próprios recebem builds de teste sem ler ou alterar dados de produção; promoção para `main` continua sendo a única rota para o deploy oficial. |
| CLD-009 | P2 | A definir | Cloudflare e retenção | Projetar retenção e compactação do log incremental e dos tombstones. | Dispositivos e cursores possuem contrato suficiente para podar dados antigos sem perder alterações nem ressuscitar exclusões após longos períodos offline. |
| CLD-010 | P2 | Condicional | Cloudflare e domínio | Adotar domínio próprio depois do endurecimento operacional. | Avaliar somente após CLD-003 a CLD-007; domínio, DNS, certificado, origem OAuth e migração da PWA são definidos antes de substituir `workers.dev`. |
| CLD-011 | P1 | Condicional | Cloudflare e identidade | Preparar a abertura do login para qualquer conta Google e revisar o custo de servir todos os assets por meio do Worker. | Antes de sair do grupo de teste, OAuth é publicado para produção e política de privacidade, contato de suporte e eventual verificação do Google estão disponíveis; `run_worker_first` é reavaliado porque cada asset consome uma invocação do Worker. |
| CLD-012 | P1 | Pronto | Cloudflare e identidade | Restringir no Worker as contas autorizadas durante o período privado de testes, sem depender da lista de usuários de teste do Google para escopos básicos de identidade. | D1 mantém uma allowlist administrável por e-mail normalizado; login fora da lista falha sem criar usuário ou sessão; remover uma entrada invalida as sessões correspondentes; o runbook documenta convite e revogação; testes cobrem conta permitida, não permitida e removida. |
| CLD-013 | P1 | Condicional | Cloudflare e segurança | Adicionar proteção contra abuso e rate limiting antes de permitir login para qualquer conta Google. | Limites por origem técnica, conta e classe de operação protegem login, sincronização e mídia sem bloquear rajadas legítimas de reconexão offline; respostas e observabilidade permitem distinguir abuso de indisponibilidade. Gatilho: preparação da abertura pública prevista em CLD-011. |
| CLD-014 | P2 | Condicional | Cloudflare e segurança | Remover `style-src 'unsafe-inline'` da CSP quando os estilos dinâmicos puderem usar classes, propriedades customizadas validadas ou nonces. | A interface funciona sem estilos inline irrestritos e a CSP de produção remove `unsafe-inline` sem quebrar temas, artes, PWA ou Google Identity. Gatilho: revisão da camada de estilos ou ampliação do público. |
| ARC-001 | P2 | Condicional | Arquitetura | Continuar reduzindo as renderizações e templates legados de `main.ts` sem criar abstrações preventivas. | Cada área tocada transfere responsabilidades completas para sua feature e a barreira arquitetural não aumenta. Gatilho: alteração funcional na área correspondente. |
| UI-001 | P3 | Condicional | Interface | Substituir aliases históricos de ações e pesquisa pelas primitives `sf-*`. | Área revisada usa somente as primitives atuais sem regressão visual. Gatilho: alteração funcional na área. |
| SET-002 | P3 | A definir | Configurações e Aparência | Definir preferências de aparência realmente suportadas antes de reintroduzir controles: tema, densidade, escala, persistência e comportamento por dispositivo. | Contrato de preferências aprovado, persistência e defaults definidos, interface mostra somente escolhas funcionais e testes cobrem restauração e telas estreitas. |
| SET-003 | P2 | A definir | Configurações e Regras de carga | Decidir se o SoulForge oferecerá regras da casa para capacidade e carga. Se sim, modelar um contrato declarativo que não altere fichas existentes e deixe explícito quando a regra vale apenas para personagens novos. | Decisão de produto registrada; caso aprovada, contrato, persistência, criação e ficha distinguem regra oficial e regra da casa, com migração ou preservação explícita das fichas existentes. |

## Limitações deliberadas — não tratar como pendência automática

Os pontos abaixo só devem entrar nas pendências ativas após uma decisão
explícita de produto:

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
| RST-001 | 16/10/2026 · decisão de escopo | A regra oficial permite escolher o mesmo movimento de descanso duas vezes, e o SoulForge já suporta essa seleção no descanso longo. Projetos e seus contadores são conduzidos narrativamente pelo mestre e não alteram a ficha de forma automática; por decisão de produto, não haverá acompanhamento, persistência ou interface própria para eles. |
| CMP-002 | 17/10/2026 · decisão de produto | Não haverá capítulo independente para Features. Elas permanecem consultadas e editadas no contexto da Classe, Subclasse, Ancestralidade ou Comunidade que as concede, preservando origem, tier e regras associadas e evitando Features avulsas sem vínculo válido. A decisão só deve ser reaberta se Features passarem a ser escolhidas independentemente, se a busca global se tornar uma necessidade comprovada em mesa, ou se uma Feature precisar ser reutilizada com segurança por múltiplas origens. |
| CND-001 | 13/10/2026 · `0.38.0` | A ficha ganhou a faixa permanente Estados em cena, que mantém Condições e efeitos de habilidade separados, porém próximos. Condições podem ser aplicadas com origem narrativa opcional, consultadas em detalhe e removidas por origem; Pack ausente preserva ID e nome. Vulnerável recebe origem automática ao preencher Estresse e a perde somente ao limpar ao menos uma marca, sem encerrar uma origem de cena ainda ativa. |
| DOC-001 | 10/09/2026 · `0.26.19` | README, PWA, Packs, Compendium, progressão, ancestralidades, comunidades, marcadores e auditoria de efeitos reconciliados com o código e o changelog. Orientações antigas da interface também foram corrigidas. |
| UI-002 | 10/09/2026 · `0.26.19` | Criação por classe ganhou estandarte e abas de subclasse; seleção de personagens virou galeria responsiva; troca Vault→Loadout recebeu confirmação em duas etapas; e cartas ativas passaram a usar trilho horizontal em containers estreitos. Padrões e testes correspondentes foram registrados. |
| UI-003 | 13/09/2026 · `0.27.0` | Vault passou a usar cartões de altura uniforme, títulos e resumos limitados, grade específica por largura e ação integrada de 48 px para mover ao Loadout. Validado em iPad horizontal (3 colunas), iPad vertical (2), desktop (4) e celular (1). |
| NAV-001 | 13/09/2026 · `0.27.0` | A navegação delegada passou a reconhecer cliques originados em botões, `span`, `svg` e `path`; Compendium e Configurações mantêm destinos independentes e alvos mínimos de 44 × 44 px na ficha. Fluxos da ficha, seleção e editor foram validados no navegador e cobertos por testes. |
| PRG-001 | 13/09/2026 · `0.27.0` | Aprimoramento da subclasse e Multiclasse passaram a se bloquear mutuamente dentro do mesmo Tier, consultando o rascunho e `advancementSelections` persistidas. A interface desabilita a escolha conflitante após reabrir a ficha e a aplicação rejeita estados inválidos antes de salvar. |
| PRG-002 | 13/09/2026 · `0.27.0` | Todas as opções de progressão exibem antecipadamente `Custo: 1 avanço` ou `Custo: 2 avanços`; Proficiência e Multiclasse recebem destaque de custo integral e ficam desabilitadas sem saldo suficiente. Grupos de caixinhas inspirados na ficha física distinguem quantos usos a opção permite no Tier e quantos avanços cada uso consome, sem mensagens redundantes em aparência de erro. |
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
| UI-005 | 26/09/2026 · `0.32.1` | Os cartões de Escolhas de classe passaram a apresentar os valores persistidos em modo de leitura e a abrir os campos somente após “Editar escolhas”. A regra da Feature permanece visível como orientação secundária, com tipografia menor e cor discreta, preservando informações mecânicas como o gasto de Favor e o Dado do Patrono sem competir visualmente com os dados da ficha. |
| UI-006 | 12/10/2026 · `0.37.2` | A escolha de cartas da criação e da progressão separa seleção de detalhes. Selos, controles explícitos e resumos persistentes tornam a escolha inequívoca; a progressão usa grade de duas colunas com expansão em linha inteira, sem comprimir ou sobrepor o conteúdo rolável. |
| SET-001 | 13/10/2026 · `0.37.4` | Configurações foi reorganizada como página vertical de utilitários: Nuvem, Conteúdo e Packs e Backup e compartilhamento. Packs possuem contagem, rolagem interna com indicador persistente e altura responsiva; Aparência, Progressão e Regras de carga saíram por não terem controles funcionais. A importação de ficha ficou no seletor e a exportação passou ao menu `•••` da ficha correspondente. |
| NAV-002 | 12/10/2026 · `0.37.1` | Configurações deixa de depender de uma ficha ativa na seleção de personagens. Dispositivos novos podem importar Packs, personagens e backups antes da primeira criação; informações que dependem da ficha, como capacidade de carga, assumem um estado informativo até que ela exista. |
| RSC-001 | 26/09/2026 · `0.33.0` | Recursos criados pela pessoa usuária agora exibem um menu próprio para remoção, com confirmação que identifica nome e valor atual. A origem customizada é persistida e migrada para registros legados, enquanto recursos principais, derivados ou concedidos por regras permanecem protegidos. |
| CRI-001 | 27/09/2026 · `0.34.0` | A escolha de ancestralidade agora permite expandir cada card para consultar nome e descrição das Features Top e Bottom antes de selecionar. A prévia usa o controle nativo acessível para clique, toque e teclado, preserva a seleção atual e não substitui a etapa posterior que define as Features de uma ancestralidade mista. |
| CRI-002 | 12/10/2026 · `0.37.0` | A quantidade de cartas iniciais passou a ser calculada pelas Features de Fundação declaradas no Pack. Preparado, da Escola do Conhecimento do Mago, concede uma terceira carta elegível já na criação; a tela, a interação, a validação e a montagem da ficha usam o mesmo limite e não interpretam descrições livres. |
| CRI-003 | 12/10/2026 · `0.37.3` | A distribuição inicial de atributos passou a começar pelo atributo e apresentar um seletor persistente com progresso e estados textuais. Uma faixa visual integrada evita painéis e botões aninhados; pedras repetidas conservam identidades independentes, troca e liberação são explícitas e mouse, toque e teclado compartilham o mesmo fluxo responsivo sem drag-and-drop. |
| COM-002 | 27/09/2026 · `0.34.1` | A matriz automatizada cobre Pack ausente, comunidade local, comunidade importada e ficha legada. Referências persistidas são mantidas quando o conteúdo não está instalado; a origem narrativa nunca é convertida pelo nome em conteúdo mecânico; e a criação concede a Feature vinculada exclusivamente ao ID da comunidade. |
| EFF-001 | 10/09/2026 · `0.26.19` | A auditoria de classes e efeitos passou a registrar com precisão o que a Engine já estrutura — contadores, dados armazenados, modificadores, fichas e términos — e as lacunas que ainda exigem contrato próprio. A cobertura atual, os Packs e os testes correspondem ao documento. |
| ART-002 | 27/09/2026 · `0.34.0` | O comando `pnpm run artwork:derive` gera detalhe e miniatura WebP sem ampliar a origem, preservando orientação EXIF e aceitando dimensões e qualidade configuráveis. A dependência está fixada e o uso consta na política de assets. |
| CRD-003 | 27/09/2026 · `0.34.0` | As 210 cartas de Core e Hope & Fear foram revisadas em 10 checkpoints privados contra o SRD 2.0 de 25/08/2026. Resumos e efeitos integrais foram conferidos, IDs preservados e os bundles Core (189) e Pavor (21) regenerados como `2.0.0-local`; o relatório rastreável conserva fonte, checksum e referências sem replicar texto oficial. |
| PRG-003 | 28/09/2026 · `0.35.0` | O assistente de progressão ganhou uma etapa opcional após a carta obrigatória. A pessoa pode manter a coleção ou escolher uma carta adquirida e substituí-la por outra elegível de nível igual ou inferior; a removida sai também do Loadout e de estados de indisponibilidade, a nova entra no Vault e a troca fica registrada no histórico estruturado. |
| BKP-001 | 08/10/2026 · `0.36.0` | Dados locais agora podem ser exportados em backup completo, incluindo fichas, Packs instalados, Definitions locais e complementos. A restauração valida tudo, gera uma cópia de segurança e substitui as coleções em transação única. Um segundo formato compartilha somente autoria local e complementos, com prévia e escolha explícita para conflitos. |
| MRK-001 | 12/10/2026 · `0.37.0` | Marcadores e efeitos temporários agora declaram `any-rest`, disparado uma única vez em descanso breve ou longo. O editor, o processamento de descanso, a migração transacional de conteúdo local, a importação de Packs, backups e conteúdo compartilhável preservam arquivos legados; o Talismã Encantado foi canonizado para o novo evento. |
| CLD-001 | 08/10/2026 · `0.36.0` | A infraestrutura Cloudflare entrou em produção com Worker e Static Assets, D1, R2 privado, migração inicial, endereço `workers.dev`, secrets restritos e deploy automático validado pelo GitHub Actions. |
| CLD-002 | 08/10/2026 · `0.36.0` | Login Google opcional e sincronização local-first foram validados com ficha importada, personagem criado do zero, imagens próprias e recuperação desktop→iPad. |
| CLD-003 | 12/10/2026 · `0.36.1`–`0.37.2` | Workers Logs permaneceram habilitados com amostragem de 100% durante a baseline inicial; Worker, D1 e R2 tiveram uso e armazenamento registrados sem erros nem custo faturável. A inspeção dos logs não encontrou tokens, cookies, e-mails, IDs de usuário, fichas ou payloads. Os alertas de orçamento de US$ 1 e US$ 5 estão ativos; amostragem e custo de `run_worker_first` deverão ser reavaliados antes da abertura pública ou ao atingir 10 mil requisições por dia. |
| CLD-004 | 10/10/2026 · `0.36.0` | A integração oficial do Vitest com o runtime Cloudflare cobre autenticação Google, sessões, isolamento entre contas, revisões, conflitos, tombstones, D1, R2, mídia e exclusão de conta. A suíte do sincronizador cobre fila offline, retomada, retry, conflitos, mídia, logout, exclusão da nuvem e filtros de conteúdo local. |
| CLD-005 | 15/10/2026 · `0.38.0`–`0.38.2` | Respostas da PWA, API e erros recebem CSP compatível com Google Identity, HSTS, COOP, proteção contra framing e os demais cabeçalhos definidos; mutações exigem origem válida e corpos são limitados antes do parse. O artefato compilado e o smoke pós-deploy protegem o roteamento real da Cloudflare. Login, popup, avatar, ficha, mídia, atualização, offline e reconexão foram validados em PC e iPad; a inspeção das últimas 24 horas registrou 268 invocações bem-sucedidas, nenhum erro do Worker e nenhum dado pessoal nos logs. |
| PWA-001 | 15/10/2026 · `0.38.2` | A matriz da PWA foi concluída com instalação limpa, atualização do Service Worker, preservação dos dados locais, reabertura e consulta offline, backup e restauração sem rede, edição offline seguida de reconexão e conflito real entre PC e iPad. Isolamento entre contas, fila e resolução de conflitos também permanecem cobertos pela suíte automatizada do CLD-004. |
| DEP-001 | 15/10/2026 · `0.38.2` | A atualização para Node 24, pnpm 12, Vite 8, PWA 2, Vitest 5, TypeScript 7, Actions e dependências Cloudflare foi concluída sem vulnerabilidades conhecidas na auditoria. CI de pull request, suíte local, build, instalação limpa, atualização da PWA, offline, preservação local, backup/restauração e retomada da sincronização foram validados. |

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
- [Nuvem e sincronização](CLOUD_SYNC.md)
- [Padrões de interface](UI_PATTERNS.md)
