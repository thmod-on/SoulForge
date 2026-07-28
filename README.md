# SoulForge

SoulForge é uma PWA *offline-first* para acompanhar personagens de Daggerheart sem depender de servidor durante a mesa.

Versão atual: `0.4.0`.

## Acesso e instalação

A versão publicada é disponibilizada pelo GitHub Pages: <https://thmod-on.github.io/SoulForge/>.

- No iPad/iPhone, abra o endereço no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.
- Em navegadores de desktop compatíveis, use a opção de instalar o app exibida na barra de endereços ou no menu do navegador.

Consulte [PWA e uso offline](docs/PWA_OFFLINE.md) para detalhes sobre cache, atualizações e limitações.

## Desenvolvimento local

Pré-requisitos:

- Node.js 22;
- pnpm 11.9 ou compatível;
- Git.

```bash
pnpm install
pnpm run dev
```

O Vite exibirá o endereço local no terminal; normalmente é `http://localhost:5173/`.

## Validação

```bash
pnpm run build
pnpm run test
```

## Estrutura principal

- `docs/`: decisões, contratos de domínio e guias de manutenção.
- `packs/`: conteúdo declarativo, imutável e versionado por Pack.
- `src/domain/`: tipos e regras puras do domínio.
- `src/storage/`: persistência local no navegador.
- `src/content/`: carregamento dos Packs instalados.
- `src/`: entrada da PWA e interface inicial.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo de domínio](docs/DOMAIN_MODEL.md)
- [Compendium](docs/COMPENDIUM.md)
- [PWA e uso offline](docs/PWA_OFFLINE.md)
- [Dados locais](docs/LOCAL_DATA.md)
- [Packs](docs/PACKS.md)
- [Padrões de interface](docs/UI_PATTERNS.md)
- [Versões e releases](docs/RELEASES.md)

## Publicação

O workflow em `.github/workflows/deploy.yml` gera o `dist/` e publica no GitHub Pages a cada *push* na branch `main`.
