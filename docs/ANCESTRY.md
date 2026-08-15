# Ancestralidades

## Objetivo

Este documento descreve como o SoulForge deve representar, selecionar e usar ancestralidades de Daggerheart.

O projeto usa o termo **ancestralidade**, adotado pelo material oficial. Ele representa linhagem e aspectos físicos ou biológicos do personagem; não representa cultura, origem social ou local de criação.

Esses aspectos pertencem à **comunidade**. Juntas, ancestralidade e comunidade formam a **herança** (*Heritage*) do personagem.

O plano de dados, interface, Compendium e Packs para comunidades está em [COMMUNITIES.md](COMMUNITIES.md).

## Fontes de regra

- [Daggerheart SRD 1.0 — setembro de 2025](https://www.daggerheart.com/wp-content/uploads/2025/09/Daggerheart-SRD-9-09-25.pdf): criação de personagem, ancestralidades, ancestralidade mista e comunidades.
- [Daggerheart Homebrew Kit 1.0](https://www.daggerheart.com/wp-content/uploads/2025/07/Daggerheart-Homebrew-Kit-v1.0-July-31-2025.pdf): estrutura Top/Bottom Feature e orientações para conteúdo compatível.

Caso o material oficial seja atualizado, revisar este documento e os Packs antes de modificar validações.

## Regra-base do Core

Na criação, o personagem escolhe uma ancestralidade. Cada ancestralidade concede exatamente duas **features de ancestralidade**:

- **Top Feature**: a primeira feature listada na carta;
- **Bottom Feature**: a segunda feature listada na carta.

As features são sempre ativas; elas não ocupam espaço no Loadout ou Vault e não funcionam como cartas de Domínio.

As ancestralidades do Core são:

`Clank`, `Drakona`, `Dwarf`, `Elf`, `Faerie`, `Faun`, `Firbolg`, `Fungril`, `Galapa`, `Giant`, `Goblin`, `Halfling`, `Human`, `Infernis`, `Katari`, `Orc`, `Ribbet` e `Simiah`.

O conteúdo textual, artístico e mecânico de cada uma delas deve ser fornecido por Packs; o SoulForge não deve codificá-lo na interface.

## Ancestralidade única

Ao escolher uma ancestralidade única, o personagem recebe as duas features da mesma Definition:

```text
Ancestralidade: Galapa
Features concedidas: Galapa.top + Galapa.bottom
```

Se uma feature exigir uma escolha na criação — por exemplo, elemento, arma inata ou outro parâmetro definido pelo conteúdo — essa escolha faz parte do estado do personagem, e não da Definition da ancestralidade.

## Ancestralidade mista

Uma ancestralidade mista é uma escolha mecânica e narrativa para personagens descendentes de múltiplas ancestralidades.

As regras oficiais são:

1. registrar como o personagem se identifica na ficha; o nome pode ser híbrido, uma das ancestralidades ou um termo inventado pelo jogador;
2. escolher **a Top Feature de uma ancestralidade**;
3. escolher **a Bottom Feature de outra ancestralidade**;
4. manter somente essas duas features mecânicas.

As duas features não podem vir da mesma ancestralidade. Por exemplo, uma personagem goblin-orc pode usar `Goblin.top + Orc.bottom` ou `Orc.top + Goblin.bottom`, mas não pode usar as duas Top Features.

Uma linhagem pode incluir mais de duas ancestralidades narrativamente. Ainda assim, o personagem escolhe features de apenas duas delas; as demais podem aparecer na aparência e na história.

## Separação entre mecânica e narrativa

O SoulForge deve preservar as duas dimensões sem tentar validá-las como se fossem a mesma coisa:

| Informação | Finalidade |
| --- | --- |
| `lineageAncestryIds` | ancestralidades que fazem parte da linhagem narrada |
| `displayName` | como o personagem se identifica na ficha |
| `selectedTopFeatureId` | feature mecânica superior escolhida |
| `selectedBottomFeatureId` | feature mecânica inferior escolhida |
| `communityId` | origem cultural, social ou ambiental independente |

Isso permite, por exemplo, representar uma personagem com três linhagens narrativas e apenas as duas features permitidas pelo sistema.

## Contrato de dados

### Definition de ancestralidade

```ts
interface AncestryDefinition {
  id: string;
  type: "ancestry";
  name: string;
  description?: string;
  image?: ImageReference;
  topFeatureId: string;
  bottomFeatureId: string;
}

interface FeatureDefinition {
  id: string;
  type: "feature";
  name: string;
  origin: "ancestry" | "community" | "class" | "subclass";
  summary: string;
  effect: string;
  behaviorIds?: string[];
  creationChoices?: FeatureChoiceDefinition[];
}
```

Regras de validação:

- cada ancestralidade possui uma Top Feature e uma Bottom Feature distintas;
- ambas as features existem e têm origem `ancestry`;
- relações usam IDs estáveis;
- o conteúdo de uma feature não deve depender do nome de exibição da ancestralidade;
- uma Definition não armazena escolhas de um personagem.

### Estado da ancestralidade no personagem

```ts
interface CharacterAncestry {
  mode: "single" | "mixed";
  lineageAncestryIds: string[];
  displayName: string;
  selectedTopFeatureId: string;
  selectedBottomFeatureId: string;
  featureChoiceValues: Record<string, unknown>;
}

interface CharacterHeritage {
  ancestry: CharacterAncestry;
  communityId: string;
}
```

Validações para modo `single`:

- `lineageAncestryIds` contém uma ancestralidade;
- Top e Bottom pertencem à mesma ancestralidade.

Validações para modo `mixed`:

- `lineageAncestryIds` contém pelo menos duas ancestralidades;
- a Top e a Bottom escolhidas pertencem a ancestralidades presentes na linhagem;
- elas pertencem a ancestralidades distintas;
- só existem duas features mecânicas selecionadas, independentemente do tamanho da linhagem narrativa.

## Efeitos na ficha

Features de ancestralidade podem conceder efeitos permanentes na criação, como espaços adicionais de HP ou Stress, bônus permanente de Evasão, ou capacidades passivas. Também podem ter efeitos condicionais, custos de Esperança/Stress, usos por descanso ou ataques inatos.

Para evitar fontes de verdade duplicadas:

- HP, Stress e Evasão devem ser calculados a partir de valores-base e modificadores concedidos pelas features selecionadas;
- a ficha deve mostrar quais features originaram cada bônus permanente;
- recursos temporários, usos por descanso e texto livre de regras não devem ser executados automaticamente no primeiro recorte;
- efeitos estruturados seguros podem ser aplicados por Behaviors declarativos, conforme `DOMAIN_BEHAVIORS.md`.

## Fluxo de criação de personagem

1. apresentar a escolha entre ancestralidade única e mista;
2. consultar e pesquisar o catálogo de ancestralidades disponíveis nos Packs instalados;
3. para ancestralidade única, selecionar uma Definition e conceder Top + Bottom;
4. para ancestralidade mista, selecionar a linhagem e escolher uma Top Feature e uma Bottom Feature de ancestralidades diferentes;
5. solicitar parâmetros exigidos por features selecionadas;
6. escolher comunidade em uma etapa separada;
7. apresentar uma revisão da herança, features ativas e bônus estruturados antes de confirmar a criação.

No primeiro recorte da interface, o modo misto pode solicitar duas ancestralidades na seleção mecânica. O modelo, porém, deve aceitar uma lista maior para preservar linhagens narrativas futuras.

## Edição posterior

Ancestralidade normalmente é definida na criação. Uma edição posterior altera features potencialmente persistentes e pode invalidar escolhas ou modificar valores derivados.

Por isso, a edição deve:

- pedir confirmação explícita;
- pré-visualizar HP, Stress, Evasão e features que serão removidas ou adicionadas;
- registrar a alteração no histórico do personagem;
- nunca apagar silenciosamente parâmetros ou estados associados a uma feature removida.

## Compendium e Packs

O Compendium deve oferecer um capítulo de Ancestralidades para consultar, criar, editar e excluir Definitions. O formulário de uma ancestralidade deve exigir nome, descrição, imagem opcional, Top Feature e Bottom Feature.

Antes de excluir uma ancestralidade ou feature usada por personagens locais, o aplicativo deve avisar que as referências podem ficar indisponíveis e pedir confirmação. A remoção deve seguir `UX_GUIDELINES.md` e a política de compatibilidade de `PACKS.md`.

Conteúdo oficial do SRD usado apenas por uma mesa privada deve permanecer em um Pack local ignorado pelo Git. Ele não pode integrar o build público nem ser carregado automaticamente pelo catálogo publicado; consultar [CONTENT_POLICY.md](CONTENT_POLICY.md).

## Hope & Fear

Em 2 de agosto de 2026, a divulgação oficial de *Hope & Fear* anuncia seis novas cartas de ancestralidade: `Skykin`, `Tidekin`, `Earthkin`, `Emberkin`, `Gnome` e `Aetheris`.

O livro final ainda não está publicamente disponível nesta data. As novas ancestralidades devem ser adicionadas por Pack quando seu texto oficial estiver disponível; não inferir suas features a partir de material promocional.

## Fora do escopo inicial

- automatizar integralmente textos livres de features;
- inferir ancestralidade a partir do retrato, aparência ou nome da personagem;
- misturar comunidade com ancestralidade;
- permitir selecionar duas Top Features ou duas Bottom Features na ancestralidade mista;
- limitar a narrativa da linhagem a somente duas ancestralidades.
