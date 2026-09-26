# SoulForge

SoulForge é uma PWA *offline-first* para acompanhar personagens de Daggerheart sem depender de servidor durante a mesa.

Versão atual: `0.33.0`.

## Recursos principais

- criação, seleção e acompanhamento de personagens com armazenamento local,
  incluindo escolhas persistentes solicitadas por Features de classe, exibidas
  em modo de leitura e editadas sob demanda;
- ficha responsiva com atributos, recursos, inventário, Loadout, Vault,
  progressão, anotações, marcadores e transformações; recursos criados pela
  pessoa usuária podem ser removidos por uma ação protegida por confirmação;
- Compendium pesquisável para cartas, domínios, itens, classes,
  ancestralidades, comunidades, transformações e condições;
- conteúdo extensível por Packs locais, preservando a origem das Definitions e
  permitindo conteúdo customizado sem alterar o catálogo público;
- descansos curtos e longos com movimentos declarativos, incluindo bônus
  concedidos por Features como Transe Celestial;
- funcionamento *offline-first* após a instalação da PWA.

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
pnpm run check
pnpm run build
```

## Estrutura principal

- `docs/`: decisões, contratos de domínio e guias de manutenção.
- `packs/`: conteúdo declarativo, imutável e versionado por Pack.
- `src/domain/`: tipos e regras puras do domínio.
- `src/storage/`: persistência local no navegador.
- `src/content/`: carregamento dos Packs instalados.
- `src/`: entrada da PWA e interface inicial.

## Documentação

- [Backlog](docs/BACKLOG.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo de domínio](docs/DOMAIN_MODEL.md)
- [Classes e progressão](docs/CLASS_AND_PROGRESSION.md)
- [Implementação da progressão](docs/PROGRESSION_IMPLEMENTATION.md)
- [Ancestralidades](docs/ANCESTRY.md)
- [Compendium](docs/COMPENDIUM.md)
- [PWA e uso offline](docs/PWA_OFFLINE.md)
- [Política de artes e assets visuais](docs/ASSET_POLICY.md)
- [Processo de artes de classe](docs/CLASS_ARTWORK.md)
- [Dados locais](docs/LOCAL_DATA.md)
- [Packs](docs/PACKS.md)
- [Campos de personagem das Features](docs/FEATURE_FIELDS.md)
- [Vocabulário de itens](docs/ITEM_TRANSLATIONS.md)
- [Padrões de interface](docs/UI_PATTERNS.md)
- [Versões e releases](docs/RELEASES.md)
- [Uso de conteúdo Daggerheart](docs/CONTENT_POLICY.md)

## Publicação

O workflow em `.github/workflows/deploy.yml` gera o `dist/` e publica no GitHub Pages a cada *push* na branch `main`.
