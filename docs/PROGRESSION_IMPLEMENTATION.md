# Implementação da progressão

## Objetivo

Este documento define o plano técnico e funcional para implementar a progressão de níveis no SoulForge com base nas regras oficiais do Daggerheart Core.

As regras de jogo e o contrato de Classes estão em [CLASS_AND_PROGRESSION.md](CLASS_AND_PROGRESSION.md). Este documento define como representá-las, validá-las e aplicá-las sem acoplar conteúdo de uma classe à interface.

## Escopo do Core

A regra-base atende todos os personagens do Core: níveis 1 a 10, divididos nos mesmos quatro tiers.

| Tier | Níveis |
| --- | --- |
| 1 | 1 |
| 2 | 2–4 |
| 3 | 5–7 |
| 4 | 8–10 |

Classes alteram elegibilidade de Domínios, subclasses e efeitos de features. Elas não alteram os intervalos de tier nem a sequência geral de subida de nível.

## Princípios de arquitetura

- Progressão é orientada por dados: tiers, conquistas, avanços e bloqueios não ficam codificados na tela.
- O personagem armazena apenas escolhas concluídas e estado; Classes, Cartas, Domínios e Features permanecem Definitions dos Packs.
- Valores derivados, como Evasão e limiares de dano, são calculados por funções puras e não devem ter múltiplas fontes de verdade.
- Uma subida de nível é atômica: ou todas as escolhas válidas são gravadas, ou nenhuma alteração é persistida.
- Efeitos textuais complexos de Features não serão interpretados automaticamente no primeiro recorte.

## Modelo de regras

Introduzir uma Definition de regras do sistema, inicialmente `ruleset.daggerheart-core`, com:

```ts
interface ProgressionRuleset {
  id: string;
  maxLevel: 10;
  tiers: ProgressionTier[];
  tierAchievements: TierAchievement[];
  advancements: AdvancementDefinition[];
  domainCardRules: DomainCardRules;
  multiclassRule: MulticlassRule;
}

interface ProgressionTier {
  id: "tier-1" | "tier-2" | "tier-3" | "tier-4";
  minLevel: number;
  maxLevel: number;
  advancementIds: string[];
}

interface AdvancementDefinition {
  id: string;
  minimumTier: number;
  choiceCost: 1 | 2;
  slotCount: number;
  requires?: Requirement[];
  excludes?: string[];
  effects: ProgressionEffect[];
}
```

O `ruleset` deve representar, entre outros, o custo de duas escolhas para Proficiência e Multiclasse, a disponibilidade de Multiclasse a partir do nível 5 e os bloqueios entre Multiclasse e carta aprimorada de Subclasse.

Os valores de `slotCount` e a disponibilidade por tier devem ficar nos dados do ruleset. Isso permite refletir a ficha oficial e adaptar uma futura errata sem reescrever código de interface.

## Estado do personagem

O Character precisa registrar dados mínimos para calcular e auditar a progressão:

```ts
interface CharacterProgression {
  level: number;
  proficiency: number;
  permanentEvasionBonus: number;
  traitMarksByTier: Record<string, TraitId[]>;
  advancementSelections: AdvancementSelection[];
  multiclasses: MulticlassSelection[];
  levelHistory: LevelUpRecord[];
}

interface LevelUpRecord {
  fromLevel: number;
  toLevel: number;
  completedAt: string;
  tierAchievementIds: string[];
  advancementSelections: AdvancementSelection[];
  mandatoryDomainCardAction: DomainCardAction;
  notes?: string;
}
```

Dados complementares necessários:

- `primaryClassId` e `primarySubclassId`;
- IDs de features de classe e subclasse concedidas;
- HP e Stress máximos permanentes;
- cartas aprendidas, separadas entre Loadout e Vault;
- Domínio escolhido por cada multiclasse;
- modificadores temporários ativos, fora do estado permanente de progressão.

## Valores derivados

Implementar funções puras para calcular valores, em vez de atualizar campos soltos por toda a interface.

| Valor | Origem |
| --- | --- |
| Evasão | base da classe + bônus permanente de progressão + bônus permanentes de features + modificadores temporários |
| HP máximo | HP inicial da classe + avanços + features, limitado pelas regras do sistema |
| Stress máximo | base do sistema + avanços + features, limitado pelas regras do sistema |
| Limiares de dano | valores base da armadura equipada + nível atual |
| Dados de dano da arma | dados da arma multiplicados pela Proficiência |

Evasão base e HP inicial permanecem vinculados à classe principal. Uma multiclasse não substitui esses valores.

## Fluxo de subida de nível

O assistente de progressão deve trabalhar somente do nível atual para o próximo nível. Não permitir pular níveis no primeiro recorte.

1. **Início:** apresentar o novo nível, tier e efeitos obrigatórios.
2. **Conquista de tier:** aplicar o ganho dos níveis 2, 5 e 8; quando aplicável, solicitar a nova Experiência `+2` e limpar marcações de atributos.
3. **Dois avanços:** permitir escolher avanços elegíveis, mostrando custo, espaços disponíveis e bloqueios.
4. **Efeitos derivados:** pré-visualizar Proficiência, Evasão, HP, Stress e limiares de dano resultantes.
5. **Carta obrigatória:** escolher carta de Domínio elegível, definir Loadout/Vault ou realizar troca válida.
6. **Revisão:** mostrar todas as alterações, consequências e regras de exclusividade.
7. **Confirmação:** persistir o personagem e o `LevelUpRecord` em uma única transação.

Cancelar ou fechar o fluxo não deve alterar o personagem.

## Validações obrigatórias

- o novo nível deve ser exatamente o nível atual + 1 e não superar 10;
- existem exatamente duas escolhas de avanço, considerando custos;
- o avanço ainda possui espaço não marcado no tier autorizado;
- atributos escolhidos não estão marcados no tier atual;
- Proficiência e Multiclasse usam duas escolhas;
- Multiclasse só está disponível no nível 5 ou superior;
- cartas de Domínio pertencem a um Domínio acessível e respeitam o limite de nível;
- carta de multiclasse usa o limite de metade do nível atual, arredondado para cima;
- Loadout não excede cinco cartas;
- Especialização e Maestria seguem a ordem da Subclasse;
- escolhas de Subclasse e Multiclasse respeitam seus bloqueios por tier.

## Fases de entrega

### Fase 1 — fundação de domínio

- introduzir tipos de Classe, Subclasse, Feature e Ruleset;
- criar dados mínimos do Core para uma classe de demonstração;
- migrar o Character atual para o novo estado de progressão;
- implementar cálculos puros e testes unitários.

### Fase 2 — progressão guiada sem efeitos complexos

- substituir a tela visual atual pelo assistente de nível;
- aplicar nível, marcos, avanços estruturados, Proficiência, Evasão, HP, Stress e cartas;
- registrar histórico;
- manter features complexas apenas como aviso de revisão ao usuário.

### Fase 3 — conteúdo de classe e criação de personagem

- implementar CRUD de Classes, Subclasses e Features no Compendium;
- criar o fluxo de seleção de classe e subclasse para novos personagens;
- validar Domínios e cartas a partir do catálogo de Packs.

### Fase 4 — efeitos declarativos

- representar efeitos de progressão de classe por `ProgressionEffect`;
- integrar Behaviors para regras que possam ser executadas com segurança;
- tratar recursos próprios de classe, efeitos temporários e gatilhos narrativos.

### Fase 5 — expansão Hope & Fear

- importar a expansão como Pack separado;
- comparar o livro final com `ruleset.daggerheart-core`;
- adicionar as quatro classes, Dread e transformações como Definitions;
- criar uma extensão de ruleset somente se houver mudança oficial de progressão.

## Testes e migração

Antes de liberar progressão funcional, cobrir com testes:

- todos os limites de tier;
- conquistas dos níveis 2, 5 e 8;
- bloqueios de Multiclasse/Subclasse;
- marcação e limpeza de atributos;
- limite de cinco cartas no Loadout;
- cálculo de carta de multiclasse;
- persistência e reabertura de um personagem após subida;
- migração do personagem demo e de personagens locais já salvos.

Toda alteração na estrutura do Character precisa de uma migração compatível no repositório IndexedDB.
