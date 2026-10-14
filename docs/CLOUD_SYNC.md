# Nuvem e sincronização

O SoulForge continua sendo local-first. Todas as alterações são gravadas no
IndexedDB antes de qualquer acesso à rede; entrar com Google apenas habilita
backup e sincronização entre dispositivos.

Produção: <https://soulforge.guitojoker-cloudflare.workers.dev/>.

## Estado atual

Estado revisado em **13 de outubro de 2026**, na versão **0.38.1**:

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

CLD-003 e CLD-004 estão concluídos. A observabilidade, a baseline operacional,
os alertas de orçamento e a suíte de integração estão ativos e documentados.
Os demais itens operacionais e de segurança estão detalhados no
[backlog](./BACKLOG.md).

## Componentes

- Cloudflare Worker: entrega a PWA e atende `/api/*`;
- D1: contas, sessões, fichas, Definitions locais, complementos, revisões e
  tombstones;
- R2 privado: retratos e imagens de criações locais;
- Google Identity Services: comprova a identidade; o SoulForge emite sua
  própria sessão segura e não armazena tokens Google;
- IndexedDB: fonte primária no dispositivo e base do funcionamento offline.

Packs importados, Definitions pertencentes a Packs e a ficha de demonstração
não são sincronizados.

## Configuração de referência

Os recursos de produção já foram criados. Esta lista registra a configuração
necessária para reproduzir o ambiente sem expor credenciais:

1. Banco D1 `soulforge`, ligado ao binding `DB` em `wrangler.jsonc`.
2. Bucket R2 privado `soulforge-media`, ligado ao binding `MEDIA`.
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

CLD-005 está **em andamento**. As versões 0.38.0 e 0.38.1 passaram a aplicar no Worker,
inclusive sobre Static Assets, respostas da API e erros:

- CSP restrita à própria origem e aos endpoints necessários do Google Identity;
- HSTS por um ano, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` e
  `Permissions-Policy` sem câmera, microfone, geolocalização, pagamentos, USB
  ou serial;
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

O item só será concluído depois do deploy restrito e da validação no PC e iPad
de carregamento, atualização da PWA, login e logout Google, avatar, sincronização,
upload/download de imagem e reabertura offline.

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

## Observabilidade e custos

A configuração de Workers Logs está explícita no `wrangler.jsonc`, com logs de
invocação habilitados e `head_sampling_rate` igual a `1` (100%). A produção
usa essa configuração desde o commit `d6f21d4`. Ela deve ser revisada antes da
abertura ao público ou quando o uso atingir 10 mil requisições por dia.
Consulte a documentação de [Workers Logs][workers-logs].

Somente invocações e erros técnicos são registrados. Erros inesperados emitem
apenas o tipo do erro; tokens, cookies, e-mails, IDs de usuário, fichas e
payloads de sincronização não devem ser enviados aos logs.

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

Depois de confirmar o horário e o banco de produção, pause os deploys e, se o
banco ainda estiver acessível, preserve uma exportação diagnóstica. A
restauração remota é destrutiva para alterações posteriores ao ponto escolhido:

```bash
pnpm exec wrangler d1 time-travel restore soulforge --bookmark="<bookmark>"
```

Após a restauração, valide contas, fichas, cursores, tombstones e vínculos de
mídia antes de reabrir o deploy. Exportações para retenção superior a sete dias
ficam fora deste marco.

### Excluir conta e mídia com segurança

Use **Excluir dados da nuvem** em **Configurações > Nuvem**, autenticado como a
própria pessoa. A operação remove a conta remota, seus registros, sessões e
objetos R2, mas preserva os dados locais do dispositivo atual. Confirme depois
que a sessão foi invalidada e que um novo login não recupera os dados
excluídos.

Não remova manualmente apenas o registro D1 ou apenas os objetos R2: isso pode
deixar mídias órfãs ou referências quebradas. A limpeza diária de sessões
expiradas e mídias sem referência há mais de 24 horas será implementada em
CLD-006. Até existir a política segura de cursores prevista em CLD-009, não
podar `sync_changes` nem tombstones.

## Migração do GitHub Pages

IndexedDB não atravessa origens. Antes de trocar de endereço, crie um backup
completo no GitHub Pages; restaure-o no endereço `workers.dev`, entre com Google
e só então ative a sincronização.

O GitHub Pages deve publicar um aviso de mudança com acesso ao backup e às
instruções de restauração. A origem antiga será mantida durante a janela de
transição de 30 dias, até **9 de novembro de 2026**. Depois dessa data, o
workflow e o Pages poderão ser desativados somente após confirmar que o aviso
permaneceu disponível durante todo o período.

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
[workers-logs]: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
[budget-alerts]: https://developers.cloudflare.com/billing/manage/budget-alerts/
[cld-004-workflow]: https://github.com/thmod-on/SoulForge/actions/runs/38077763131
