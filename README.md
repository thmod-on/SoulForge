# SoulForge

SoulForge e uma PWA offline-first para acompanhar personagens de Daggerheart sem depender de servidor durante a mesa.

## Como rodar localmente

```bash
pnpm install
pnpm run dev
```

## Como validar

```bash
pnpm run build
pnpm run test
```

## Estrutura principal

- `docs/`: decisoes e contrato de dominio do projeto.
- `packs/`: conteudo declarativo imutavel, versionado por Pack.
- `src/domain/`: tipos e regras puras do dominio.
- `src/storage/`: persistencia local no navegador.
- `src/content/`: carregamento dos Packs instalados.
- `src/`: entrada da PWA e interface inicial.

## Publicacao

O workflow em `.github/workflows/deploy.yml` publica o `dist/` no GitHub Pages quando houver push na branch `main`.
