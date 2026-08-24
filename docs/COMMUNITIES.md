# Roadmap: Comunidades

## Objetivo

Adicionar comunidades como conteúdo declarativo do Compendium e como uma escolha obrigatória na criação de personagem, sem confundir a comunidade mecânica com a origem narrativa que já existe em fichas antigas.

No Daggerheart, **ancestralidade** descreve a linhagem; **comunidade** descreve a cultura, classe social ou ambiente que mais influenciou a criação do personagem. Juntas, elas formam a herança (*Heritage*).

Uma comunidade concede uma Feature de comunidade. Os seis adjetivos impressos em sua carta são inspiração narrativa: não são seis escolhas mecânicas e não devem gerar campos obrigatórios.

Fontes:

- [Daggerheart SRD 1.0](https://www.daggerheart.com/wp-content/uploads/2025/09/Daggerheart-SRD-9-09-25.pdf): criação de personagem e comunidades;
- [Daggerheart Homebrew Kit 1.0](https://www.daggerheart.com/wp-content/uploads/2025/07/Daggerheart-Homebrew-Kit-v1.0-July-31-2025.pdf): orientação para criação de comunidades.

## Decisões de produto

| Assunto | Decisão |
| --- | --- |
| Escolha inicial | Cada personagem escolhe uma comunidade mecânica por ID, entre as Definitions disponíveis nos Packs instalados. |
| Conteúdo oficial | `Core - Comunidades` é um Pack local e sujeito à política de conteúdo do projeto. Conteúdos de expansões entram em Packs separados. |
| Origem narrativa | O nome livre hoje salvo como `community` não será apagado. Ele passa a representar uma origem/local/grupo narrativo opcional, distinta da comunidade mecânica. |
| Feature | Cada CommunityDefinition concede exatamente uma FeatureDefinition de origem `community`. A feature é ativa enquanto aquela comunidade estiver selecionada. |
| Escolhas adicionais | Só aparecem se a Feature declarar escolhas estruturadas. O SoulForge nunca deve deduzir campos ou efeitos a partir de `summary`, `effect` ou descrição livre. |
| Adjetivos | São exibidos como referências narrativas, sem validação nem persistência obrigatória. |

Exemplo: uma personagem pode ter **Loreborne** como comunidade mecânica e `Vigília de Tristelo` como sua origem narrativa específica.

## Modelo de dados e compatibilidade

### Definition

Adicionar `CommunityDefinition` ao catálogo:

```ts
type CommunityDefinition = BaseDefinition & {
  type: "community";
  description?: string;
  adjectives: string[]; // normalmente seis
  featureId: string;
  image?: string;
};
```

A Feature vinculada deve declarar `sourceType: "community"`, `sourceId` igual ao ID da comunidade e um tier/origem explícito de comunidade. Game markers e escolhas de criação continuam pertencendo à Feature, pois são comportamento, não apresentação da comunidade.

### Personagem

Evoluir a identidade sem quebrar personagens persistidos:

```ts
identity: {
  community: string;          // legado: origem narrativa exibida
  primaryCommunityId?: string; // escolha mecânica por ID
  communityFeatureChoiceValues?: Record<string, unknown>;
}
```

Regras de migração:

- fichas antigas continuam abrindo mesmo sem `primaryCommunityId`;
- nenhum texto livre é convertido automaticamente em uma comunidade oficial;
- uma ficha sem comunidade mecânica não recebe Feature nem marcador;
- uma futura edição permite escolher uma comunidade e preservar ou alterar a origem narrativa separadamente.

## Fluxo de criação de personagem

O fluxo passa de oito para nove etapas:

1. Identidade — nome, retrato e origem narrativa opcional;
2. Ancestralidades;
3. Features de ancestralidade;
4. **Comunidade**;
5. Atributos;
6. Classe e subclasse;
7. Cartas iniciais;
8. Experiências;
9. Revisão.

### Etapa 4: Comunidade

- pesquisa por nome e filtro por Pack;
- grade de cards com nome, origem do Pack e resumo curto;
- painel/preview selecionado com descrição, seis adjetivos e Feature concedida;
- seleção de uma única comunidade;
- campos adicionais somente quando a Feature declarar `creationChoices` estruturadas;
- validação impede avançar sem comunidade mecânica quando existir ao menos uma opção instalada;
- se não existir Pack de comunidades instalado, mostrar estado vazio com atalho para Configurações > Dados locais, em vez de permitir uma escolha incompleta silenciosa.

### Revisão e criação

A revisão deve mostrar em uma região de Herança:

- ancestralidade(s) e Features Top/Bottom;
- comunidade escolhida e Feature de comunidade;
- origem narrativa, quando preenchida;
- escolhas estruturadas feitas para a Feature, em linguagem legível.

`buildCharacterFromDraft` deve persistir IDs e escolhas; o nome exibido é apenas uma projeção do catálogo, nunca uma chave de relacionamento.

## Ficha do jogador

1. Sob o retrato, exibir ancestralidade, comunidade mecânica e classe como informações distintas e compactas; a origem narrativa pode aparecer como subtítulo opcional.
2. Em **Traços**, criar/manter uma região `Comunidade` contendo a Feature concedida, com o mesmo padrão visual de ancestralidade e classe.
3. Marcadores declarados pela Feature de comunidade entram na sincronização existente de game markers, sem regra especial na interface.
4. Ao perder a Definition por remoção de Pack, manter o ID e indicar conteúdo indisponível; nunca remover estado da ficha automaticamente.

## Compendium: CRUD de comunidades

Adicionar **Comunidades** ao capítulo de Herança, ao lado de Ancestralidades e antes de Condições.

### Lista e detalhes

- pesquisa por nome;
- filtro por Pack;
- card consistente com Ancestralidades: imagem opcional, nome, Pack e Feature;
- detalhe com descrição, adjetivos em tags e Feature vinculada;
- conteúdo de Pack é consultável, não editável nem excluível;
- conteúdo local pode ser criado, editado e excluído com confirmação.

### Formulário local

Campos obrigatórios:

- nome;
- descrição;
- seis adjetivos (interface em tags, sem texto livre único);
- nome e texto da Feature de comunidade.

Campos opcionais:

- imagem;
- escolhas estruturadas da Feature;
- game markers declarados pela Feature.

Salvar uma comunidade local cria/atualiza sua Definition e a Feature vinculada de forma transacional. Exclusão deve bloquear ou exigir confirmação explícita quando houver personagens que a referenciem.

## Packs

1. Estender validação e importação para `CommunityDefinition` e Features de origem `community`.
2. Gerar `Core - Comunidades` com as nove comunidades do material oficial e suas Features, mantendo-o local/ignorado conforme `CONTENT_POLICY.md`.
3. Acompanhar Features com marcadores ou escolhas declaradas; exemplos como tokens de Seaborne devem usar o mesmo modelo de game markers já existente.
4. Não embutir conteúdo oficial no código ou no build público.

## Ordem de implementação

### Fase 1 — Fundação de dados

- [x] Criar `CommunityDefinition`, atualizar união `Definition`, catálogo, serialização e validação de Packs.
- [x] Evoluir `Character.identity` e o draft de criação com ID de comunidade.
- [x] Manter compatibilidade de leitura para fichas existentes sem comunidade mecânica.
- [x] Cobrir a resolução da comunidade e sua Feature com testes.

### Fase 2 — Conteúdo e Compendium

- [x] Criar o Pack local `Core - Comunidades`.
- [x] Adicionar capítulo, lista, detalhe e CRUD de Comunidades.
- [x] Reaproveitar o editor declarativo de Feature e game markers, sem duplicar regras.

### Fase 3 — Criação e ficha

- [x] Inserir a etapa Comunidade no wizard e atualizar a navegação de passos.
- [x] Implementar pesquisa e preview da comunidade e da Feature concedida.
- [x] Atualizar revisão, criação do personagem e apresentação na ficha.
- [x] Sincronizar game markers provenientes de comunidade.

### Fase 4 — Segurança e qualidade

- [ ] Confirmar comportamento ao remover/atualizar Packs usados por personagens.
- [ ] Testar criação com Pack ausente, comunidade local, conteúdo importado e ficha legada.
- [ ] Validar em iPad paisagem e desktop.
- [ ] Atualizar documentação de Packs, modelo de domínio, criação de personagem e changelog da versão de entrega.

## Fora de escopo desta entrega

- escolhas automáticas baseadas no texto da Feature;
- converter automaticamente nomes narrativos antigos em comunidades oficiais;
- permitir mais de uma comunidade mecânica por personagem;
- inventar comunidades ou Features oficiais sem Pack/fonte declarada;
- transformar adjetivos em bônus, perícias ou campos obrigatórios.
