# Features ativáveis e efeitos temporários

## Propósito

Uma `FeatureDefinition` pode declarar uma ativação estruturada quando cria um efeito que persiste na ficha por algum tempo. O SoulForge nunca deduz custo, duração ou bônus a partir de `summary`.

O estado da sessão fica em `Character.activeFeatureEffects`; a Definition do Pack permanece imutável.

Antes de declarar uma nova automação, consulte a [auditoria de classes e efeitos](CLASS_EFFECTS_AUDIT.md). Ela delimita o que a ficha já consegue aplicar com segurança e o que ainda depende de interação da mesa.

## Contrato da Definition

```ts
activation: {
  label: "Ativar Manto",
  costs: [
    { kind: "game-marker", sourceDefinitionId: "feature.exemplo.favor", markerId: "favor", amount: 1 }
  ],
  endsOn: ["severe-damage", "scene-end"],
  modifiers: [
    { kind: "defense-per-tier", fields: ["minor", "major"] }
  ],
  reminders: ["Vantagem em rolagens de ação para intimidar um alvo."]
}
```

### Custos

- `resource`: consome uma `ResourceTrack` da ficha por `resourceId`.
- `game-marker`: consome um contador declarado por uma Definition ativa. A fonte e o `markerId` tornam o custo explícito e não dependem de texto livre.

Todos os custos são validados antes de qualquer consumo. Uma ativação não pode ser aplicada duas vezes enquanto já estiver ativa.

### Modificadores e duração

O primeiro modificador suportado é `defense-per-tier`, que soma o Tier atual aos limiares indicados. O bônus é calculado sobre a defesa efetiva; a defesa-base persistida não é modificada.

Condições suportadas de término:

- `scene-end`: o jogador encerra manualmente o efeito ao fim da cena;
- `severe-damage`: o motor de efeitos já sabe remover o estado, mas o gatilho será conectado quando existir um fluxo de registro de dano com severidade explícita. Reduzir PV manualmente não encerra efeitos, pois isso não informa a severidade do dano.
- `short-rest` e `long-rest`: o efeito é encerrado automaticamente ao concluir o descanso correspondente;
- `next-successful-attack`: a ficha mantém o lembrete até o jogador encerrar o efeito, pois ainda não registra resultados de ataques.

## Interface

- A faixa **Efeitos ativos** aparece acima de Recursos apenas quando houver algum efeito.
- Ela mostra bônus, lembretes, condições de término e o botão **Encerrar**.
- A Feature oferece seu botão de ativação somente quando declarar `activation`.

## Exemplo atual

O Pack privado *Hope & Fear - Classes e Subclasses* declara **Favor** como um contador de classe iniciado em 3 e **Manto do Patrono** como uma Feature ativável que consome 1 Favor, concede `+Tier` aos limiares Menor e Maior e termina por dano severo ou fim da cena.

Após gerar uma nova versão do Pack, o arquivo em `local-packs/imports/` deve ser reimportado no navegador para atualizar as Definitions instaladas.
