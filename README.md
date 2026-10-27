# SoulForge

SoulForge é uma PWA *offline-first* para acompanhar personagens de Daggerheart sem depender de servidor durante a mesa.

Versão atual: `0.42.2`.

## Recursos principais

- criação, seleção e acompanhamento de personagens com armazenamento local,
  incluindo escolhas persistentes solicitadas por Features de classe, exibidas
  em modo de leitura e editadas sob demanda, e prévia das Features Top e Bottom
  durante a escolha de ancestralidade;
- ficha responsiva com atributos, recursos, inventário, Loadout, Vault,
  progressão, anotações, marcadores, Condições e transformações; Condições
  ativas preservam suas origens e Vulnerável acompanha automaticamente o
  preenchimento do Estresse; a criação e a progressão
  distinguem claramente selecionar uma carta de consultar seu efeito completo,
  e a progressão permite a troca opcional de uma carta de Domínio por outra
  elegível;
- Compendium pesquisável para cartas, domínios, itens, classes,
  ancestralidades, comunidades, transformações e condições;
- comunidades mecânicas persistidas por ID, com compatibilidade para fichas
  legadas e indicação explícita quando o Pack de origem não está instalado;
- conteúdo extensível por Packs locais, preservando a origem das Definitions e
  permitindo conteúdo customizado sem alterar o catálogo público; as 210 cartas
  Core e Hope & Fear foram revisadas com resumo para listagens e efeito integral
  para o detalhe, e cartas selecionadas de Arcano, Códice, Esplendor, Lâmina e
  Valor possuem artes originais do SoulForge; famílias convencionais de armas e
  armaduras também recebem artes genéricas sem substituir imagens próprias;
- descansos curtos e longos com movimentos declarativos, incluindo bônus
  concedidos por Features como Transe Celestial; antes dos movimentos, o
  Loadout pode ser reorganizado gratuitamente entre Vault e as cinco cartas
  ativas;
- funcionamento *offline-first* após a instalação da PWA;
- Configurações focadas em utilitários reais: sincronização, Packs, backup e
  compartilhamento de conteúdo; a exportação individual fica no menu da ficha
  correspondente no seletor de personagens; contas autorizadas também recebem
  uma biblioteca privada de Packs, instalada em dispositivo novo — inclusive
  quando o login ocorre depois da abertura — e atualizada somente mediante
  confirmação; remoções e atualizações de Packs usados
  apresentam o impacto nas fichas, mas preservam suas referências;
- login Google opcional para sincronizar fichas, criações locais e imagens sem
  tornar a mesa dependente da conexão; o Worker restringe origens, tamanhos de
  entrada e tipos de conteúdo, aplica cabeçalhos de segurança também à PWA e
  executa manutenção diária de sessões expiradas e mídias sem referência; o
  histórico incremental protege dispositivos ativos por 90 dias e permite
  reconstrução automática segura após períodos maiores sem sincronização.

## Acesso e instalação

A versão oficial é disponibilizada pela Cloudflare:
<https://soulforge.guitojoker-cloudflare.workers.dev/>.

- No iPad/iPhone, abra o endereço no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.
- Em navegadores de desktop compatíveis, use a opção de instalar o app exibida na barra de endereços ou no menu do navegador.

Consulte [PWA e uso offline](docs/PWA_OFFLINE.md) para detalhes sobre cache,
atualizações e limitações. O GitHub Pages permanece temporariamente disponível
para exportação dos dados locais armazenados na origem anterior.

## Desenvolvimento local

Pré-requisitos:

- Node.js 24 LTS (`24.19.0` no arquivo `.node-version`);
- pnpm 12.11.2;
- Git.

Para preparar artes, instale também as dependências opcionais com
`python -m pip install -r requirements-artwork.txt`. O comando
`pnpm run artwork:derive -- --help` documenta a geração de WebP de detalhe e
miniatura.

```bash
pnpm install
pnpm run dev
```

`pnpm run dev` inicia somente a UI local, sem Service Worker ou emulador
Cloudflare. Para validar login, sincronização, biblioteca privada e PWA, use
`pnpm run dev:full`. O Vite exibirá o endereço local no terminal; normalmente
é `http://localhost:5173/`.

## Validação

```bash
pnpm run check
pnpm run build
pnpm run check:performance
```

O CI também executa essa validação em pull requests e antes dos deploys para
Cloudflare e GitHub Pages.

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
- [Nuvem e sincronização](docs/CLOUD_SYNC.md)
- [Política de artes e assets visuais](docs/ASSET_POLICY.md)
- [Processo de artes de classe](docs/CLASS_ARTWORK.md)
- [Artes de cartas](docs/CARD_ARTWORK.md)
- [Dados locais](docs/LOCAL_DATA.md)
- [Packs](docs/PACKS.md)
- [Campos de personagem das Features](docs/FEATURE_FIELDS.md)
- [Vocabulário de itens](docs/ITEM_TRANSLATIONS.md)
- [Padrões de interface](docs/UI_PATTERNS.md)
- [Versões e releases](docs/RELEASES.md)
- [Uso de conteúdo Daggerheart](docs/CONTENT_POLICY.md)

## Publicação

O workflow `deploy-cloudflare.yml` valida, migra o D1 e publica a PWA e a API
como um único Cloudflare Worker. Durante a transição, `deploy.yml` mantém uma
versão estática no GitHub Pages para exportação dos dados locais existentes.
