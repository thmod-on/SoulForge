# Nuvem e sincronização

O SoulForge continua sendo local-first. Todas as alterações são gravadas no
IndexedDB antes de qualquer acesso à rede; entrar com Google apenas habilita
backup e sincronização entre dispositivos.

Produção: <https://soulforge.guitojoker-cloudflare.workers.dev/>.

## Estado atual

Estado revisado em **10 de outubro de 2026**, na versão **0.36.0**:

- o Worker `soulforge` entrega a PWA e atende às rotas `/api/*`;
- o D1 `soulforge` está com a migração inicial aplicada;
- o bucket R2 privado `soulforge-media` armazena as mídias sincronizadas;
- o Google Identity está habilitado somente para o grupo de teste;
- cada push em `main` executa verificações, build, migrações D1 e deploy pelo
  GitHub Actions;
- foram validados uma ficha importada, um personagem criado do zero, imagens
  próprias e sincronização do desktop para o iPad;
- a ficha de demonstração Kael II permaneceu local, como esperado.

A Cloudflare é a produção oficial. O GitHub armazena o código e executa o
deploy, mas não hospeda o backend nem os dados da produção.

CLD-004 está coberto pela suíte de integração local. CLD-003 permanece em
andamento até o primeiro deploy com observabilidade explícita, a coleta da
baseline real e a confirmação dos alertas de orçamento. Os demais itens
operacionais e de segurança estão detalhados no [backlog](./BACKLOG.md).

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

### Testes de integração

`pnpm run test:app` executa a suíte da aplicação e do sincronizador em Node,
com IndexedDB isolado. `pnpm run test:worker` executa o handler HTTP no runtime
local da Cloudflare, aplicando as migrations reais a um D1 isolado e usando um
bucket R2 local. Certificados Google são simulados com chaves efêmeras; nenhum
teste acessa Google, D1, R2 ou credenciais de produção.

`pnpm test` executa as duas suítes, e `pnpm run check` também verifica os tipos
específicos da aplicação, do Worker e dos testes Cloudflare antes do deploy.

## Observabilidade e custos

A configuração de Workers Logs está explícita no `wrangler.jsonc`, com logs de
invocação habilitados e `head_sampling_rate` igual a `1` (100%). A produção
passará a usá-la no próximo deploy. Ela deve ser revisada antes da abertura ao
público ou quando o uso atingir 10 mil requisições por dia. Consulte a
documentação de [Workers Logs][workers-logs].

Somente invocações e erros técnicos são registrados. Erros inesperados emitem
apenas o tipo do erro; tokens, cookies, e-mails, IDs de usuário, fichas e
payloads de sincronização não devem ser enviados aos logs.

O acompanhamento operacional deverá registrar métricas do Worker, do D1 e do
R2. Os alertas de orçamento de **US$ 1** e **US$ 5** são uma configuração
manual da conta Cloudflare, não parte do `wrangler.jsonc` nem do deploy. Veja
[Budget alerts][budget-alerts].

### Baseline operacional de 24 horas

A coleta de **10 de outubro de 2026** está pendente do deploy desta revisão e
de acesso autenticado ao painel. Após o deploy, usar uma única janela de 24
horas encerrada no momento da validação e registrar o commit implantado. Se um
gráfico não possuir amostras na janela, escrever **sem dados**, nunca `0`.

| Referência | Valor |
| --- | --- |
| Versão | `0.36.0` |
| Commit implantado | Pendente após o deploy |
| Janela UTC de 24 horas | Pendente após o deploy |
| Worker: requisições, erros e CPU | Pendente de coleta |
| D1: leituras, escritas e armazenamento | Pendente de coleta |
| R2: operações e armazenamento | Pendente de coleta |

### Alertas de orçamento

No painel, acesse **Manage Account > Billing > Billable Usage > Budget
alerts**, crie limites de **US$ 1** e **US$ 5** e confirme o e-mail destinatário.
Os alertas são informativos e não interrompem o serviço. Situação em 10 de
outubro de 2026: **pendente de configuração manual em sessão autenticada**.
CLD-003 só poderá ser concluído após preencher a baseline e confirmar os dois
alertas.

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
