# Nuvem e sincronização

O SoulForge continua sendo local-first. Todas as alterações são gravadas no
IndexedDB antes de qualquer acesso à rede; entrar com Google apenas habilita
backup e sincronização entre dispositivos.

Produção: <https://soulforge.guitojoker-cloudflare.workers.dev/>.

## Estado atual

Estado revisado em **29 de outubro de 2026**, na versão **0.43.1**:

- o Worker `soulforge` entrega a PWA e atende às rotas `/api/*`;
- o D1 `soulforge` está com a migração inicial aplicada;
- o bucket R2 privado `soulforge-media` armazena as mídias sincronizadas;
- o Google Identity está habilitado somente para o grupo de teste;
- cada push em `main` executa verificações, build, migrações D1 e deploy pelo
  GitHub Actions;
- foram validados uma ficha importada, um personagem criado do zero, imagens
  próprias e sincronização do desktop para o iPad;

A Cloudflare é a produção oficial. O GitHub armazena o código e executa o
deploy, mas não hospeda o backend nem os dados da produção.

CLD-003, CLD-004 e CLD-005 estão concluídos. A baseline operacional, os
alertas de orçamento, a suíte de integração e o endurecimento HTTP permanecem
documentados. A ingestão de Workers Logs foi desativada na configuração do
projeto em 29 de outubro para não depender da assinatura separada de
Observability; o aplicativo não depende dela para funcionar.
Os demais itens operacionais e de segurança estão detalhados no
[backlog](./BACKLOG.md).

## Componentes

- Cloudflare Worker: entrega a PWA e atende `/api/*`;
- D1: contas, sessões, fichas, Definitions locais, complementos, revisões e
  tombstones;
- R2 privado `soulforge-media`: retratos e imagens de criações locais;
- R2 privado `soulforge-pack-library`: catálogo e bundles da Biblioteca
  privada, isolados de mídia e entregues exclusivamente pelo Worker autenticado;
- Google Identity Services: comprova a identidade; o SoulForge emite sua
  própria sessão segura e não armazena tokens Google;
- IndexedDB: fonte primária no dispositivo e base do funcionamento offline.

Packs importados, Definitions pertencentes a Packs e a ficha de demonstração
não são sincronizados.

## Configuração de referência

Os recursos de produção já foram criados. Esta lista registra a configuração
necessária para reproduzir o ambiente sem expor credenciais:

1. Banco D1 `soulforge`, ligado ao binding `DB` em `wrangler.jsonc`.
2. Bucket R2 privado `soulforge-media`, ligado ao binding `MEDIA`, e bucket
   `soulforge-pack-library`, ligado ao binding `PACK_LIBRARY`. O segundo deve
   ser criado antes do primeiro deploy desta feature com
   `pnpm exec wrangler r2 bucket create soulforge-pack-library`.
3. OAuth Client ID Web do Google com a origem HTTPS do Worker autorizada. O
   `GOOGLE_CLIENT_ID` é público e não deve ser tratado como segredo.
4. Para desenvolvimento, cópia de `.dev.vars.example` como `.dev.vars`, com o
   mesmo Client ID ou o identificador do ambiente de preview.
5. Banco local preparado com `pnpm run db:migrate:local`; produção atualizada
   com `pnpm run db:migrate:remote`.

O deploy automatizado usa os secrets `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ACCOUNT_ID` no GitHub. O token de CI está restrito à conta do
projeto e usa a nomenclatura vigente de permissões:

- `Workers Editor`;
- `D1 Write`;
- `Workers R2 Storage Write`;
- `Account Settings Read`.

O login feito por uma pessoa no aplicativo não dá ao navegador acesso a esse
token. A sessão Google comprova a identidade para o Worker; somente o GitHub
Actions usa o token da Cloudflare para publicar a aplicação e aplicar
migrações.

### Biblioteca privada e contas autorizadas

As rotas `/api/library/catalog` e `/api/library/packs/:id/:version` exigem uma
sessão válida. O login consulta a tabela D1 `authorized_emails` antes de criar
usuário ou sessão e a confere novamente em cada acesso autenticado; remover um
e-mail dessa tabela invalida a próxima utilização da sessão. Quando a conta
definida na secret privada `ACCESS_ADMIN_EMAILS` entra no SoulForge, a seção
**Configurações → Nuvem → Acesso privado** permite autorizar ou revogar e-mails
sem usar SQL. Essa secret é uma lista separada por vírgulas, configurada somente
no Worker (por exemplo, `pnpm exec wrangler secret put ACCESS_ADMIN_EMAILS`);
ela não pertence ao Git, ao bundle da PWA nem aos arquivos públicos. A
revogação encerra imediatamente as sessões existentes da conta, sem apagar seus
dados remotos.

Enquanto o OAuth Google estiver no modo de teste, conceder acesso no SoulForge
não substitui a inclusão manual da mesma conta em **Público-alvo → Usuários de
teste** no Console Google. O Google prova a identidade; `authorized_emails`
continua sendo a autorização efetiva para sincronização e biblioteca privada.
O SoulForge não tenta automatizar, consultar ou espelhar essa lista do Google:
ela não é uma API de autorização de conteúdo e não deve exigir credenciais
administrativas Google no Worker.

Quando a pessoa autorizada faz login depois de abrir o aplicativo, a sessão
notifica explicitamente a biblioteca privada: em um dispositivo sem Packs, o
catálogo é consultado e a instalação inicial ocorre de forma transacional. O
indicador `navigator.onLine` orienta a interface, mas não bloqueia uma tentativa
de sincronização autenticada; uma resposta do Worker é a confirmação efetiva de
conectividade.

Uma falha de login permanece visível na seção **Nuvem**, sem remover o botão
para tentar novamente. O Worker devolve uma mensagem segura para credencial
inválida, conta não autorizada ou indisponibilidade temporária; ele não grava
o resultado do login em Workers Logs. Uma falha ao consultar a biblioteca após
um login aceito aparece separadamente e não encerra a sessão.

Os bundles não são sincronizados entre contas nem expostos por R2 público. A
publicação local usa `pnpm run packs:publish`; ela não integra o deploy da PWA.

## Desenvolvimento e publicação

```bash
pnpm install
pnpm run db:migrate:local
pnpm run dev
pnpm run check
pnpm run test:app
pnpm run test:worker
pnpm run build
pnpm run deploy
```

O fluxo normal de produção é automático: um push em `main` inicia o workflow
`Deploy Cloudflare Worker`, que executa `pnpm install --frozen-lockfile`,
`pnpm run check`, `pnpm run build`, aplica as migrações remotas e publica o
Worker com seus Static Assets. Um deploy manual deve ser reservado para
diagnóstico ou recuperação e precisa passar pelas mesmas verificações.

A API limita cada imagem a 1,5 MB e a mídia remota a 100 MB por conta.

### Segurança HTTP e limites de entrada

CLD-005 foi **concluído em 15 de outubro de 2026**, após a validação da versão
0.38.2 em produção. As versões 0.38.0 a 0.38.2 passaram a aplicar no Worker,
inclusive sobre Static Assets, respostas da API e erros:

- CSP restrita à própria origem e aos endpoints necessários do Google Identity;
- HSTS por um ano, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` e
  `Permissions-Policy` sem câmera, microfone, geolocalização, pagamentos, USB
  ou serial;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`, compatível com o popup
  do Google quando FedCM não estiver disponível, e `X-XSS-Protection: 0` para
  desativar filtros legados;
- `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` e
  `form-action 'self'`;
- origem obrigatória e exatamente igual à origem do Worker em `POST`, `PUT`,
  `PATCH` e `DELETE`, sem habilitar CORS;
- leitura limitada antes do parse: 32 KiB no login Google, 2 MB por lote de
  sincronização e 1,5 MB por imagem;
- lotes locais com no máximo 100 alterações e 2 MB, confirmados separadamente
  para que uma falha posterior não reenvie alterações já aceitas.

Estilos inline continuam autorizados pela CSP porque cores e imagens locais são
aplicadas dinamicamente. `unsafe-eval`, origens genéricas e curingas não são
permitidos. JSON malformado retorna `400`, tipo de conteúdo inadequado retorna
`415` e corpo acima do limite retorna `413` antes de ser carregado integralmente.

O deploy restrito foi validado no PC e no iPad para carregamento, atualização
da PWA, login e logout Google, avatar, sincronização, upload/download de imagem,
reabertura offline e retomada após reconexão.

O build valida que o Wrangler compilado conserva `run_worker_first: true`. Após
o deploy, `pnpm run check:production` consulta a origem oficial sem credenciais
e confirma HTML, asset versionado, manifesto, Service Worker, API, erros,
cabeçalhos e rejeição de mutações sem `Origin`. O smoke não substitui o teste
autenticado e não executa rollback automático.

Enquanto `run_worker_first` estiver ativo para todos os assets, cada requisição
estática também invoca o Worker e consome sua franquia. A estratégia deverá ser
reavaliada antes da abertura pública ou ao atingir 10 mil requisições diárias.
Até lá, a aplicação permanece centralizada no Worker para evitar diferenças de
segurança entre assets e API.

Evidência manual e operacional da 0.38.2:

| Ambiente | Evidência verificada | Resultado |
| --- | --- | --- |
| PC | atualização; ausência de quebra aparente por CSP; logout/login; popup; avatar; ficha; imagem; offline e reconexão | Aprovado em 15/10/2026. Teste realizado no navegador habitual; a versão exata não foi registrada. |
| iPad | atualização da PWA instalada; login; avatar; ficha; imagem; offline e reconexão | Aprovado em 15/10/2026. Modelo, iPadOS e versão exata do Safari não foram registrados. |
| Cloudflare | workflow do commit `202f06c`; ausência de `5xx`; logs sem dados pessoais; volume de invocações observado | Aprovado em 15/10/2026. Em uma consulta às 14:01 BRT, Workers Logs exibiu 268 sucessos e 0 erros nas últimas 24 horas. A amostra continha somente método e rota; identificadores de mídia estavam mascarados, sem tokens, cookies, e-mails, fichas ou payloads. |

Na mesma inspeção, o painel de requisições registrava 277 requisições, sendo
262 originadas no Brasil e 15 nos Estados Unidos, com 240 respostas `2xx`, 30
respostas `3xx`, 7 respostas `4xx` e nenhuma `5xx`. As requisições dos Estados
Unidos são compatíveis com o agente `node` observado e com o smoke executado
por runners do GitHub Actions; trata-se de uma inferência operacional, não de
uma identificação da pessoa ou do serviço de origem. Os `4xx` também são
compatíveis com as verificações negativas do smoke, que exercitam `404` e a
rejeição `403` de mutações sem `Origin`. O volume e as rotas observadas não
indicam abuso ou acesso indevido.

### Testes de integração

`pnpm run test:app` executa a suíte da aplicação e do sincronizador em Node,
com IndexedDB isolado. `pnpm run test:worker` executa o handler HTTP no runtime
local da Cloudflare, aplicando as migrations reais a um D1 isolado e usando um
bucket R2 local. Certificados Google são simulados com chaves efêmeras; nenhum
teste acessa Google, D1, R2 ou credenciais de produção.

`pnpm test` executa as duas suítes, e `pnpm run check` também verifica os tipos
específicos da aplicação, do Worker e dos testes Cloudflare antes do deploy.

CLD-004 permanece concluído. O módulo `cloudClient` é a fronteira de injeção
dos testes do sincronizador; não deve ser criada outra abstração no runtime
apenas para testes. Mudanças em autenticação, sessão, D1, R2, mídia ou rotas
devem atualizar a suíte Worker. Mudanças em fila, retry, conflitos, tombstones,
mídia ou logout devem atualizar a suíte do sincronizador. Um aumento comum de
cobertura não reabre CLD-004; uma falha de produção não coberta ou um novo
comportamento relevante deve originar uma pendência própria.

A evidência inicial é o [workflow do commit `d6f21d4`][cld-004-workflow], com
315 testes da aplicação e 9 testes Worker/Cloudflare aprovados antes do deploy.

## Métricas, custos e Observability

Workers Logs e a amostragem de invocações foram úteis para validar a
infraestrutura, mas não são necessários para executar a PWA, a sincronização,
o D1, o R2 ou a manutenção diária. Em **29 de outubro de 2026**, o
`wrangler.jsonc` passou a declarar `observability.enabled: false` e o Worker
deixou de emitir eventos técnicos por `console`. Assim, o próximo deploy não
ingerirá esses eventos na assinatura de Observability.

A baseline e as inspeções registradas abaixo são evidências históricas, não
uma dependência operacional. O acompanhamento ordinário passa a usar os
painéis de métricas de Worker, D1 e R2, a página de deploys e os alertas de
orçamento da conta, sem consultas a Workers Logs. Antes do próximo deploy, a
proprietária da conta deve também cancelar a assinatura de Observability ou
migrá-la para o plano Free no painel Cloudflare; editar este repositório não
altera cobranças nem assinaturas da conta.

O acompanhamento operacional deverá registrar métricas do Worker, do D1 e do
R2. Os alertas de orçamento de **US$ 1** e **US$ 5** são uma configuração
manual da conta Cloudflare, não parte do `wrangler.jsonc` nem do deploy. Veja
[Budget alerts][budget-alerts].

### Baseline operacional inicial

A coleta cobre o período entre a publicação da `0.36.1` e o horário solicitado
para fechamento, totalizando aproximadamente 44 horas. O uso relevante ocorreu
depois das primeiras 24 horas, por isso o intervalo foi estendido até
**12 de outubro de 2026 às 20:37 BRT**. Durante a janela também foram publicadas
as versões `0.36.2`, `0.37.0`, `0.37.1` e `0.37.2`; todas preservaram a mesma
configuração de observabilidade. Valores iguais a zero abaixo são amostras
efetivamente exibidas pelo painel, não ausência de dados.

| Referência | Valor |
| --- | --- |
| Versões observadas | `0.36.1` a `0.37.2` |
| Commit inicial | `6946ec0` (`release: publish 0.36.1`) |
| Commit vigente na coleta | `d9957a3` (`release: publish 0.37.2`) |
| Janela | 11/10/2026 03:42 UTC a 12/10/2026 23:37 UTC; 11/10 00:42 a 12/10 20:37 BRT |
| Worker | 200 requisições de assets, 166 invocações, 166 sucessos inferidos por ausência de falhas, 0 erros e taxa de erro de 0%; CPU P50 1,88 ms, P90 3,16 ms e P99 4,05 ms; cache de assets 56% |
| Workers Logs | 165 sucessos e 0 erros na consulta independente; amostra visível de 50 eventos contendo somente método, rota e metadados técnicos, sem tokens, cookies, e-mails, IDs de usuário, fichas ou payloads |
| D1 | 512 consultas: 364 leituras e 148 escritas; 789 linhas lidas e 306 escritas; 393 kB armazenados em 9 tabelas no momento da coleta |
| R2 | Na janela: 330,09 kB enviados e 330,09 kB baixados; o gráfico contabiliza somente objetos com pelo menos 100 KiB. No período de cobrança exibido, 8 de outubro a 8 de novembro: 32 operações Classe A e 31 Classe B. Estado atual: 3 objetos e 535,2 kB armazenados |
| Custo R2 | US$ 0,00; nenhum uso faturável no período atual |

A diferença de um evento entre invocações e Workers Logs decorre de superfícies
analíticas independentes da Cloudflare. O painel do R2 não oferece o mesmo
intervalo personalizado para operações Classe A/B; por isso esses contadores
são identificados pelo período de cobrança, enquanto transferência usa a janela
exata da baseline e armazenamento representa o estado no momento da coleta.

### Alertas de orçamento

Em **10 de outubro de 2026**, foram confirmados no painel os alertas
`SoulForge — aviso US$ 1` e `SoulForge — alerta US$ 5`, ambos com um
destinatário. A conta também mantém o alerta automático de US$ 10 da
Cloudflare. Os alertas são gerais para a conta, informativos e não interrompem
o serviço. Com o registro da baseline acima, CLD-003 foi concluído em
**12 de outubro de 2026**.

## Runbook de recuperação

### Manutenção diária

O mesmo Worker executa uma manutenção diária pelo Cron Trigger `17 3 * * *`,
às **03:17 UTC**. A rotina remove sessões expiradas e mídias que permanecem sem
referência por mais de 24 horas. Objetos R2 são colocados antes em uma fila
durável no D1: uma falha do bucket preserva a fila e a execução seguinte repete
a exclusão de forma idempotente.

Até 29 de outubro, cada execução registrava em Workers Logs somente contagens
agregadas de sessões expiradas, mídias enfileiradas, objetos removidos e itens
pendentes para retry. A rotina não emitirá mais esses eventos; falhas continuam
marcadas pela execução agendada da Cloudflare e são cobertas pela suíte de
integração, sem gravar identificadores ou payloads.
Até a versão `0.39.0`, `sync_changes`, tombstones e registros com `deleted_at`
não participavam dessa limpeza. A entrega `0.40.0` acrescenta essa etapa com
retenção de 90 dias; ela passa a ser efetiva depois que o workflow publicar o
Worker e aplicar sua migration no D1 de produção.

Em **18 de outubro de 2026**, a primeira execução real da versão `0.39.0`,
commit `64ff659`, apareceu em **Workers & Pages > soulforge > Observability**
às **03:17:40 UTC** — 00:17:40 BRT — como `cloud_maintenance_completed`.
A rotina terminou em **241 ms**, com `expiredSessions: 0`, `mediaQueued: 0`,
`mediaDeleted: 0` e `mediaPendingRetry: 0`. A consulta filtrada apresentou
**1 sucesso e 0 erros**. Os zeros são coerentes com a ausência de sessões ou
mídias elegíveis naquela execução; o evento contém somente contagens agregadas
e metadados técnicos da invocação, sem contas, e-mails, tokens, cookies, chaves
R2, fichas ou payloads. Com essa evidência, CLD-006 foi concluído.

### Retenção do histórico de sincronização

A partir da versão `0.40.0`, a CLD-009 identifica cada instalação com um UUID aleatório,
armazenado no IndexedDB, e registra no D1 somente o cursor confirmado e a data
da última sincronização concluída. Não são coletados nome do dispositivo,
navegador, IP ou outros atributos pessoais.

Dispositivos ativos protegem seu histórico por **90 dias**. O cron calcula o
menor cursor confirmado por conta e compacta no máximo 500 alterações antigas
por execução. Tombstones só são removidos depois que seu evento já estiver na
faixa compactada. Dispositivos ausentes por mais de 90 dias deixam de bloquear
a limpeza; ao retornar, recebem `reset-required` e reconstroem automaticamente
os dados sincronizáveis por meio de um snapshot autenticado e paginado.

A reconstrução usa uma área temporária no IndexedDB e só troca o estado visível
depois de baixar todas as páginas e imagens. Criações novas permanecem na fila;
uma edição pendente de um registro já removido vira conflito explícito. Pushes
com cursor anterior ao piso compactado retornam `409 sync_reset_required` sem
gravar dados. Pulls incrementais agora percorrem todas as páginas em vez de
parar nos primeiros 500 eventos.

Até 29 de outubro, o cron também registrava em Workers Logs apenas quantidades
agregadas de dispositivos e snapshots expirados, linhas e tombstones
compactados, além dos contadores já existentes. Esses logs não serão ingeridos
após o próximo deploy. A retenção continua protegida por migrations, limites
transacionais e testes; nenhuma alteração com menos de 90 dias pode ser
compactada.

### Reverter o Worker

1. Interrompa novos deploys até entender o incidente.
2. Liste as versões com `pnpm exec wrangler deployments list` ou abra
   **Workers & Pages > soulforge > Deployments** no painel da Cloudflare.
3. Identifique uma versão conhecida e execute
   `pnpm exec wrangler rollback <version-id>`, registrando o motivo quando
   solicitado.
4. Verifique a página inicial, `/api/config`, login e leitura de uma ficha.

O rollback do Worker não reverte o D1 nem remove objetos do R2. Se o incidente
também alterou dados, avalie separadamente o Time Travel antes de restaurar o
banco.

### Consultar e restaurar o D1

O [D1 Time Travel][d1-time-travel] é automático e, no plano Free, permite
restaurar qualquer ponto dos últimos **7 dias**. Não é necessário habilitá-lo.
Para localizar o bookmark anterior a um incidente:

```bash
pnpm exec wrangler d1 time-travel info soulforge --timestamp="2026-10-10T12:00:00Z"
```

Depois de confirmar o horário e o banco de produção, pause os deploys, publique
temporariamente o Worker com `SYNC_ENABLED=false` e confira em `/api/config`
que `syncEnabled` está falso. Essa configuração bloqueia login, sincronização,
mídia e exclusão da conta com `503`; sessões e logout continuam disponíveis e
as filas locais permanecem nos dispositivos. Se o banco ainda estiver
acessível, preserve uma exportação diagnóstica. A restauração remota é
destrutiva para alterações posteriores ao ponto escolhido:

```bash
pnpm exec wrangler d1 time-travel restore soulforge --bookmark="<bookmark>"
```

Após a restauração, valide contas, fichas, cursores, tombstones e vínculos de
mídia antes de republicar a versão conhecida com `SYNC_ENABLED=true`. Confirme
`/api/config`, login, pull, push e uma imagem antes de encerrar o incidente.
Exportações para retenção superior a sete dias ficam fora deste marco. Em
validações rotineiras, consulte apenas o bookmark; nunca execute uma
restauração destrutiva em produção como teste.

Em **17 de outubro de 2026**, `wrangler d1 time-travel info soulforge`
confirmou que a produção retorna um bookmark restaurável. O valor não é
registrado neste documento porque novos bookmarks o substituem continuamente;
nenhuma restauração foi executada durante a validação.

### Excluir conta e mídia com segurança

Use **Excluir dados da nuvem** em **Configurações > Nuvem**, autenticado como a
própria pessoa. A operação remove a conta remota, seus registros, sessões e
objetos R2, mas preserva os dados locais do dispositivo atual. Confirme depois
que a sessão foi invalidada e que um novo login não recupera os dados
excluídos.

Não remova manualmente apenas o registro D1 ou apenas os objetos R2: isso pode
deixar mídias órfãs ou referências quebradas. A manutenção diária aguarda 24
horas desde a perda da última referência e usa uma fila persistente entre D1 e
R2. A compactação de `sync_changes` e tombstones deve ocorrer exclusivamente
pelo cron da CLD-009; não avance manualmente o piso de retenção nem apague
dispositivos para forçar uma poda.

## Encerramento do GitHub Pages

O Cloudflare Worker é a única origem publicada do SoulForge. O workflow e o
modo de build do GitHub Pages foram removidos em 27 de outubro de 2026, após a
validação da migração e porque os builds legados não participavam mais do deploy
oficial. O site histórico deve ser desativado no painel do repositório.

IndexedDB não atravessa origens. Quem ainda possuir dados em uma instalação
histórica deve exportar um backup completo antes de limpar o navegador e então
restaurá-lo no endereço `workers.dev`; login e sincronização devem ser ativados
somente após a restauração local.

## Conflitos e privacidade

Cada gravação remota declara a revisão que originou a edição. Se outro
dispositivo já tiver avançado essa revisão, ambas as versões são preservadas e
a tela de Configurações permite escolher uma delas ou, para fichas, salvar
ambas. Excluir a conta remove registros e objetos remotos, mas preserva os
dados locais do dispositivo atual.

Enquanto CLD-011 não for concluído, o OAuth continuará restrito ao grupo de
teste. Antes de permitir qualquer conta Google, será necessário publicar o app
OAuth para produção, disponibilizar política de privacidade e contato de
suporte e concluir eventual verificação solicitada pelo Google.

[d1-time-travel]: https://developers.cloudflare.com/d1/reference/time-travel/
[budget-alerts]: https://developers.cloudflare.com/billing/manage/budget-alerts/
[cld-004-workflow]: https://github.com/thmod-on/SoulForge/actions/runs/38077763131
