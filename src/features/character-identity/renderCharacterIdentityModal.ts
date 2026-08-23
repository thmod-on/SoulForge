import type { Catalog } from "../../domain/catalog";
import type { AncestryDefinition, Character, CharacterSkill, FeatureDefinition } from "../../domain/types";
import { getSubclassStageSkills } from "../player/subclassTrack";

type CharacterIdentitySection = "character" | "class" | "ancestry" | "community";

export type CharacterIdentityModalDependencies = {
  character?: Character;
  section?: CharacterIdentitySection;
  catalog: Catalog;
  escapeHtml(value: string): string;
};

export function renderCharacterIdentityModal(deps: CharacterIdentityModalDependencies): string {
  const { character, section, catalog, escapeHtml } = deps;
  if (!character || !section) return "";

  const identity = character.identity;
  const classDefinition = catalog.classes.find((entry) => entry.id === identity.primaryClassId)
    ?? catalog.classes.find((entry) => entry.name.toLocaleLowerCase("pt-BR") === identity.className.toLocaleLowerCase("pt-BR"));
  const subclass = catalog.subclasses.find((entry) => entry.id === identity.primarySubclassId)
    ?? catalog.subclasses.find((entry) => entry.name.toLocaleLowerCase("pt-BR") === (identity.subclassName ?? "").toLocaleLowerCase("pt-BR"));
  const ancestries = (identity.ancestryIds?.length
    ? identity.ancestryIds.map((id) => catalog.ancestries.find((entry) => entry.id === id))
    : [catalog.ancestries.find((entry) => entry.id === identity.primaryAncestryId)
      ?? catalog.ancestries.find((entry) => entry.name.toLocaleLowerCase("pt-BR") === identity.ancestry.toLocaleLowerCase("pt-BR"))]
  ).filter((entry): entry is AncestryDefinition => Boolean(entry));
  const primaryAncestry = ancestries[0];
  const ancestryFeature = (position: "top" | "bottom") => {
    const selectedId = identity.ancestryFeatureIds?.[position];
    const defaultId = position === "top" ? primaryAncestry?.topFeatureId : primaryAncestry?.bottomFeatureId;
    return catalog.features.find((entry) => entry.id === (selectedId ?? defaultId));
  };
  const topFeature = ancestryFeature("top");
  const bottomFeature = ancestryFeature("bottom");
  const ancestryNarrative = ancestries.length === 1
    ? ancestries[0]?.summary
    : ancestries.map((entry) => entry.summary ? `${entry.name}: ${entry.summary}` : "").filter(Boolean).join(" ");
  const community = catalog.communities.find((entry) => entry.id === identity.primaryCommunityId)
    ?? catalog.communities.find((entry) => entry.name.toLocaleLowerCase("pt-BR") === identity.community.toLocaleLowerCase("pt-BR"));
  const communityFeature = community ? catalog.features.find((entry) => entry.id === community.featureId) : undefined;
  const classFeatures = classDefinition
    ? [...new Set([...classDefinition.featureIds, classDefinition.hopeFeatureId])].map((id) => catalog.features.find((entry) => entry.id === id)).filter((entry): entry is FeatureDefinition => Boolean(entry))
    : [];
  const acquiredSubclassTiers = character.progression?.acquiredSubclassTiers ?? ["foundation"];
  const subclassFeatures = acquiredSubclassTiers.flatMap((tier) => getSubclassStageSkills(character, catalog, tier));
  const featureCard = (feature: FeatureDefinition | CharacterSkill | undefined, label: string, origin?: string) => {
    if (!feature) return `<article class="character-identity-feature"><span>${escapeHtml(label)}</span><h3>Indisponível</h3><p>O conteúdo desta escolha não foi encontrado no Compendium instalado.</p></article>`;
    const modifiers = "sheetModifiers" in feature ? feature.sheetModifiers?.map((modifier) => modifier.kind === "resource-max" ? `+${modifier.amount} máximo de ${modifier.resourceId}` : `+${modifier.amount} em ${modifier.field}`).join(" · ") : undefined;
    return `<article class="character-identity-feature"><span>${escapeHtml(label)}${origin ? ` · ${escapeHtml(origin)}` : ""}</span><h3>${escapeHtml(feature.name)}</h3><p>${escapeHtml("summary" in feature ? feature.summary : feature.description)}</p>${modifiers ? `<small>${escapeHtml(modifiers)}</small>` : ""}</article>`;
  };
  const ancestryOrigin = (feature: FeatureDefinition | undefined) => ancestries.find((entry) => entry.id === feature?.sourceId)?.name ?? primaryAncestry?.name;
  const content = {
    character: {
      label: "Personagem",
      title: identity.name,
      summary: `Nível ${identity.level} · ${identity.xp} / ${identity.nextLevelXp} XP`,
      body: `<div class="character-identity-facts"><span><b>Classe</b>${escapeHtml(identity.className)}</span><span><b>Subclasse</b>${escapeHtml(identity.subclassName ?? "Não definida")}</span><span><b>Ancestralidade</b>${escapeHtml(identity.ancestry)}</span><span><b>Comunidade</b>${escapeHtml(identity.community || "Não definida")}</span></div>${identity.quote ? `<p class="character-identity-quote">“${escapeHtml(identity.quote)}”</p>` : ""}`
    },
    class: {
      label: "Classe",
      title: identity.className,
      summary: identity.subclassName ? `Subclasse: ${identity.subclassName}` : "Subclasse não definida",
      body: `${classDefinition?.summary ? `<p>${escapeHtml(classDefinition.summary)}</p>` : ""}<section class="character-identity-detail-section"><h3>Características de classe ativas</h3><div class="character-identity-feature-grid">${classFeatures.map((feature) => featureCard(feature, "Classe")).join("") || "<p>Não há características de classe disponíveis.</p>"}</div></section><section class="character-identity-detail-section"><h3>${escapeHtml(subclass?.name ?? "Subclasse")}</h3><div class="character-identity-feature-grid">${subclassFeatures.map((feature) => featureCard(feature, ({ foundation: "Fundação", specialized: "Especialização", mastery: "Maestria" } as const)[feature.tier ?? "foundation"])).join("") || "<p>Nenhuma característica de subclasse foi desbloqueada.</p>"}</div></section>`
    },
    ancestry: {
      label: "Ancestralidade",
      title: identity.ancestry,
      summary: "",
      body: `${ancestryNarrative ? `<p class="character-identity-narrative">${escapeHtml(ancestryNarrative)}</p>` : ""}<div class="character-identity-feature-grid character-identity-ancestry-features">${featureCard(topFeature, "Top Feature", ancestryOrigin(topFeature))}${featureCard(bottomFeature, "Bottom Feature", ancestryOrigin(bottomFeature))}</div>`
    },
    community: {
      label: "Comunidade",
      title: identity.community || "Não definida",
      summary: community ? "Feature ativa da comunidade" : "Comunidade não definida",
      body: `${community?.summary ? `<p>${escapeHtml(community.summary)}</p>` : ""}<section class="character-identity-detail-section"><h3>Feature ativa</h3><div class="character-identity-feature-grid">${featureCard(communityFeature ?? character.skills.find((skill) => skill.source === "community"), "Comunidade")}</div></section>`
    }
  }[section];
  return `<div class="modal-backdrop" data-modal-backdrop><section class="character-identity-modal" role="dialog" aria-modal="true" aria-labelledby="character-identity-title"><header class="character-identity-modal-header"><div><span class="resource-modal-label">${escapeHtml(content.label)}</span><h2 id="character-identity-title">${escapeHtml(content.title)}</h2>${content.summary ? `<p class="character-identity-summary">${escapeHtml(content.summary)}</p>` : ""}</div><button class="modal-close modal-close-inline" type="button" data-modal-close aria-label="Fechar detalhes">x</button></header><div class="character-identity-modal-content">${content.body}</div></section></div>`;
}
