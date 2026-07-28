# Versões e releases

## Convenção de versão

O SoulForge utiliza Versionamento Semântico: `MAJOR.MINOR.PATCH`.

- `MAJOR`: mudança incompatível com dados, Packs ou fluxos públicos já existentes;
- `MINOR`: novo conjunto de funcionalidades compatível, como uma nova tela, fluxo ou CRUD;
- `PATCH`: correção, ajuste visual ou melhoria compatível sem novo escopo funcional relevante.

Enquanto o projeto estiver antes da versão `1.0.0`, mudanças ainda experimentais podem acontecer em versões `0.MINOR.PATCH`. Mesmo assim, cada entrega fechada deve atualizar a versão do aplicativo.

## Onde atualizar

Em uma release, atualizar:

- `package.json`;
- a constante de versão exibida pela interface;
- `CHANGELOG.md`.

## Checklist de release

1. revisar o escopo e o número da versão;
2. atualizar a versão e o changelog;
3. executar `pnpm run build`;
4. executar `pnpm run test`;
5. validar manualmente o fluxo alterado em resolução de iPad e desktop quando aplicável;
6. criar um commit com resumo claro;
7. enviar para `main`;
8. conferir a execução do GitHub Actions e a publicação no GitHub Pages.

## Publicação

O GitHub Actions publica automaticamente a branch `main` no GitHub Pages. Não é necessário manter servidor próprio em execução.

## Changelog

O changelog registra mudanças percebidas por usuários e mantenedores. Evite incluir detalhes internos sem impacto no uso, como mera reorganização de arquivos.
