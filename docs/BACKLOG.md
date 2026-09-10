# Backlog do SoulForge

Última revisão: 10 de setembro de 2026.

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

| ID | Prioridade | Estado | Área | Pendência | Critério de conclusão |
| --- | --- | --- | --- | --- | --- |
| COM-001 | P1 | A definir | Comunidades e Packs | Confirmar o comportamento ao remover ou atualizar um Pack cuja comunidade é usada por personagens. | Regra de domínio documentada, interface coerente, dados antigos preservados ou migrados explicitamente e testes cobrindo remoção e atualização. |
| COM-002 | P1 | Pronto | Comunidades | Completar a matriz de compatibilidade: Pack ausente, comunidade local, comunidade importada e ficha legada. | Cenários automatizados ou justificados como validação manual, todos com resultado esperado registrado. |
| COM-003 | P2 | Pronto | Comunidades | Validar o fluxo de criação e a ficha em desktop e iPad horizontal. | Criação, consulta e reabertura verificadas nas duas disposições sem corte, perda de contexto ou alvo de toque inadequado. |
| TRN-001 | P2 | A definir | Transformações | Integrar Transformações ao personagem: seleção ou concessão, limite de uma, presença no Loadout sem consumir seu limite e remoção segura. | Contrato do `Character` documentado, compatibilidade definida, fluxo implementado e regra de limite coberta por testes. |
| TRN-002 | P2 | A definir | Transformações | Aplicar marcadores e comportamentos declarativos compatíveis com cada transformação, sem interpretar texto livre. | Apenas comportamentos representáveis pelo contrato são automatizados; os demais aparecem como lembretes explícitos e possuem testes. |
| EFF-001 | P1 | Pronto | Efeitos | Atualizar a auditoria de classes e efeitos para distinguir lacunas resolvidas das ainda abertas. | A cobertura descrita coincide com os tipos, Packs locais e testes atuais. |
| EFF-002 | P2 | A definir | Efeitos | Suportar modificadores temporários simples de Proficiência e atributos. | Novo contrato declarativo documentado e interpretado genericamente, sem conhecimento de classe na Engine. |
| EFF-003 | P3 | A definir | Efeitos | Modelar estados associados a alvo e gatilhos explícitos de ataque ou dano quando houver interação visível para o jogador. | Contrato independente de texto livre, persistência definida e encerramento previsível dos efeitos. |
| EFF-004 | P2 | A definir | Efeitos | Conectar encerramentos já declarados que ainda dependem de ação manual, como dano severo e próximo ataque bem-sucedido. | Fluxos de dano e ataque produzem eventos explícitos e encerram somente os efeitos correspondentes. |
| MRK-001 | P2 | A definir | Marcadores | Representar reinicialização por qualquer descanso, distinta de descanso breve ou longo. | Contrato documentado, formulário de autoria atualizado e reinicialização coberta por testes. |
| MRK-002 | P2 | A definir | Marcadores | Permitir quantidades dinâmicas com mínimo ou derivadas de conjuntos conhecidos, como cartas de um Domínio no Loadout e Vault. | Fórmulas necessárias são declarativas, determinísticas e testadas sem consultas a texto descritivo. |
| MRK-003 | P3 | A definir | Marcadores | Avaliar contagem regressiva, cooldown temporal e outros controles ainda não modelados. | Cada novo tipo possui caso real, regra de persistência e interação definida antes de alterar o domínio. |
| RST-001 | P3 | A definir | Downtime | Criar acompanhamento de Projetos para o movimento de descanso longo “Trabalhar em projeto”. | Modelo, progresso, persistência e interface documentados; a ação deixa de ser apenas narrativa. |
| CMP-001 | P3 | Condicional | Compendium | Avaliar capítulos próprios para Condições e Features. | Implementar somente quando existirem conteúdo e fluxos suficientes para justificar capítulos separados. |
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

## Referências

- [Contexto de desenvolvimento](CODEX_CONTEXT.md)
- [Arquitetura](ARCHITECTURE.md)
- [Modelo de domínio](DOMAIN_MODEL.md)
- [Behaviors](DOMAIN_BEHAVIORS.md)
- [Comunidades](COMMUNITIES.md)
- [Transformações](TRANSFORMATIONS.md)
- [Auditoria de classes e efeitos](CLASS_EFFECTS_AUDIT.md)
- [Revisão de marcadores de cartas](GAME_MARKER_REVIEW.md)
- [Política de artes e assets visuais](ASSET_POLICY.md)
- [PWA e uso offline](PWA_OFFLINE.md)
- [Padrões de interface](UI_PATTERNS.md)
