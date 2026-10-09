# Nuvem e sincronização

O SoulForge continua sendo local-first. Todas as alterações são gravadas no
IndexedDB antes de qualquer acesso à rede; entrar com Google apenas habilita
backup e sincronização entre dispositivos.

Produção: <https://soulforge.guitojoker-cloudflare.workers.dev/>.

## Componentes

- Cloudflare Worker: entrega a PWA e atende `/api/*`;
- D1: contas, sessões, fichas, Definitions locais, complementos, revisões e
  tombstones;
- R2 privado: retratos e imagens de criações locais;
- Google Identity Services: comprova a identidade; o SoulForge emite sua
  própria sessão segura e não armazena tokens Google.

Packs importados e a ficha de demonstração não são sincronizados.

## Preparação da Cloudflare

1. Crie um banco D1 chamado `soulforge` e substitua o `database_id` em
   `wrangler.jsonc`.
2. Ative o R2 e crie o bucket privado `soulforge-media`.
3. Crie um OAuth Client ID do tipo Web no Google, cadastrando a origem HTTPS do
   Worker. Preencha `GOOGLE_CLIENT_ID` em `wrangler.jsonc`; esse identificador é
   público e não é um segredo.
4. Para desenvolvimento, copie `.dev.vars.example` para `.dev.vars` e informe
   o mesmo Client ID.
5. Aplique o banco local com `pnpm run db:migrate:local`; para produção, use
   `pnpm run db:migrate:remote`.

O deploy automatizado requer os secrets `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ACCOUNT_ID` no GitHub. O token deve ter somente permissões para
Workers Scripts, D1 e R2 da conta usada pelo projeto.

## Desenvolvimento e publicação

```bash
pnpm install
pnpm run db:migrate:local
pnpm run dev
pnpm run check
pnpm run build
pnpm run deploy
```

O plano gratuito do R2 exige ativar sua assinatura. Configure notificações de
uso no painel da Cloudflare. Além disso, a API impõe 1,5 MB por imagem e 100 MB
de mídia por conta.

## Migração do GitHub Pages

IndexedDB não atravessa origens. Antes de trocar de endereço, crie um backup
completo no GitHub Pages; restaure-o no endereço `workers.dev`, entre com Google
e só então ative a sincronização. O workflow antigo continua gerando a versão
de transição para `/SoulForge/`, sem backend em nuvem.

## Conflitos e privacidade

Cada gravação remota declara a revisão que originou a edição. Se outro
dispositivo já tiver avançado essa revisão, ambas as versões são preservadas e
a tela de Configurações permite escolher uma delas ou, para fichas, salvar
ambas. Excluir a conta remove registros e objetos remotos, mas preserva os
dados locais do dispositivo atual.
