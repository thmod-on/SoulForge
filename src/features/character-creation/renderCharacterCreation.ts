import { getSpellcastAttributeId } from "../../content/spellcastAttributes";
import { findDomain, type Catalog } from "../../domain/catalog";
import type { AncestryDefinition, FeatureDefinition } from "../../domain/types";
import { getPackDisplayName } from "../compendium/packPresentation";
import { characterCreationAttributes } from "./attributeAllocation";
import { getCreationAncestries, getCreationClasses, getCreationSubclasses, type CharacterCreationFallback } from "./characterCreationRules";
import type { CharacterCreationState } from "./characterCreationState";
import { renderCreationActions, renderCreationProgress, renderCreationTitle } from "./renderCreationChrome";
import { renderCreationAttributesStep, renderCreationClassStep, renderCreationCommunityStep, renderCreationExperiencesStep, renderCreationIdentityStep, renderCreationReviewStep } from "./renderCreationSteps";

export type CharacterCreationRenderDependencies = {
  state: CharacterCreationState;
  catalog: Catalog;
  fallback: CharacterCreationFallback;
  animate: boolean;
  escapeHtml(value: string): string;
};

export function renderCharacterCreationModal(deps: CharacterCreationRenderDependencies): string {
  const { state, catalog, fallback, animate, escapeHtml } = deps;
  if (!state.characterCreationOpen) {
    return "";
  }

  const classes = getCreationClasses(catalog, fallback);
  const classId = state.characterCreationClassId && classes.some((definition) => definition.id === state.characterCreationClassId)
    ? state.characterCreationClassId
    : classes[0].id;
  const selectedClass = classes.find((definition) => definition.id === classId) ?? classes[0];
  const subclasses = getCreationSubclasses(catalog, selectedClass.id, fallback);
  const ancestries = getCreationAncestries(catalog);
  const selectedAncestryIds = state.characterCreationAncestryIds.filter((id) => ancestries.some((ancestry) => ancestry.id === id)).slice(0, 2);
  const selectedAncestries = selectedAncestryIds.map((id) => ancestries.find((ancestry) => ancestry.id === id)).filter((ancestry): ancestry is AncestryDefinition => Boolean(ancestry));
  const needsAncestrySelection = state.characterCreationStep === 2 && selectedAncestries.length === 0;
  const topFeatures = selectedAncestries.map((ancestry) => catalog.features.find((feature) => feature.id === ancestry.topFeatureId)).filter((feature): feature is FeatureDefinition => Boolean(feature));
  const bottomFeatures = selectedAncestries.map((ancestry) => catalog.features.find((feature) => feature.id === ancestry.bottomFeatureId)).filter((feature): feature is FeatureDefinition => Boolean(feature));
  const ancestryIdForFeature = (featureId: string | undefined, position: "top" | "bottom") => selectedAncestries.find((ancestry) => (position === "top" ? ancestry.topFeatureId : ancestry.bottomFeatureId) === featureId)?.id;
  let topFeatureId = topFeatures.some((feature) => feature.id === state.characterCreationTopFeatureId) ? state.characterCreationTopFeatureId : topFeatures[0]?.id;
  let bottomFeatureId = bottomFeatures.some((feature) => feature.id === state.characterCreationBottomFeatureId) ? state.characterCreationBottomFeatureId : bottomFeatures[0]?.id;
  const hasMixedAncestry = selectedAncestries.length === 2;
  if (hasMixedAncestry && ancestryIdForFeature(topFeatureId, "top") === ancestryIdForFeature(bottomFeatureId, "bottom")) {
    topFeatureId = topFeatures[0]?.id;
    bottomFeatureId = bottomFeatures.find((feature) => ancestryIdForFeature(feature.id, "bottom") !== ancestryIdForFeature(topFeatureId, "top"))?.id;
  }
  const ancestrySearch = state.characterCreationAncestrySearch.trim().toLocaleLowerCase("pt-BR");
  const visibleAncestries = ancestries.filter((ancestry) => !ancestrySearch || `${ancestry.name} ${ancestry.summary}`.toLocaleLowerCase("pt-BR").includes(ancestrySearch));
  const featureOptionLabel = (feature: FeatureDefinition, position: "top" | "bottom") => {
    const source = selectedAncestries.find((ancestry) => (position === "top" ? ancestry.topFeatureId : ancestry.bottomFeatureId) === feature.id);
    return `${escapeHtml(source?.name ?? "Ancestralidade")} - ${escapeHtml(feature.name)}`;
  };
  const featureOption = (feature: FeatureDefinition, position: "top" | "bottom", selectedId: string | undefined, oppositeId?: string) => {
    const selected = feature.id === selectedId;
    const disabled = hasMixedAncestry && ancestryIdForFeature(feature.id, position) === ancestryIdForFeature(oppositeId, position === "top" ? "bottom" : "top");
    return `<option value="${escapeHtml(feature.id)}" ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}>${featureOptionLabel(feature, position)}</option>`;
  };
  const selectedTopFeature = topFeatures.find((feature) => feature.id === topFeatureId);
  const selectedBottomFeature = bottomFeatures.find((feature) => feature.id === bottomFeatureId);
  const bottomFeatureOrigin = selectedAncestries.find((ancestry) => ancestry.id === ancestryIdForFeature(bottomFeatureId, "bottom"));
  const automaticBottomOrigin = `<div class="selected-feature-origin"><strong>${escapeHtml(bottomFeatureOrigin?.name ?? "Ancestralidade")}</strong><small>Origem automática da Feature Bottom</small></div>`;
  const eligibleStartingCards = catalog.cards.filter((card) => card.tier === 1 && selectedClass.domainIds.includes(card.domainId));
  const selectedCardDomainId = selectedClass.domainIds.includes(state.characterCreationCardDomainId as never)
    ? state.characterCreationCardDomainId
    : selectedClass.domainIds[0];
  const visibleStartingCards = eligibleStartingCards.filter((card) => card.domainId === selectedCardDomainId);
  const selectedSubclass = subclasses.find((subclass) => subclass.id === state.characterCreationSubclassId) ?? subclasses[0];
  const spellcastAttributeId = getSpellcastAttributeId(selectedSubclass?.id, selectedSubclass);

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <form class="modal character-creation-modal ${animate ? "is-opening" : ""}" data-creation-step="${state.characterCreationStep}" onsubmit="return false;" aria-labelledby="character-creation-title">
        <button class="modal-close" type="button" data-action="cancel-new-character" aria-label="Fechar">×</button>
        <div class="character-creation-header">
        ${renderCreationProgress({ step: state.characterCreationStep })}
        ${renderCreationTitle({ step: state.characterCreationStep })}</div><div class="character-creation-scroll sf-scroll-region">
        ${renderCreationIdentityStep({ name: state.characterCreationName, community: state.characterCreationCommunity, portraitImage: state.characterCreationPortraitImage }, escapeHtml)}
        <section class="character-ancestry-picker creation-step-panel" data-creation-panel="2">
          <div><span>Origem</span></div>
          ${needsAncestrySelection ? '<p class="character-creation-selection-hint" id="character-ancestry-selection-hint">Selecione ao menos uma, no máximo duas, ancestralidades para continuar.</p>' : ""}
          <label class="sf-search-field character-creation-search"><span aria-hidden="true">⌕</span><input type="search" data-character-ancestry-search value="${escapeHtml(state.characterCreationAncestrySearch)}" placeholder="Pesquisar ancestralidade" aria-label="Pesquisar ancestralidade" /></label>
          ${ancestries.length ? `<div class="character-ancestry-choice-grid">${visibleAncestries.map((ancestry) => { const selected = selectedAncestryIds.includes(ancestry.id); const disabled = !selected && selectedAncestryIds.length >= 2; return `<label class="character-ancestry-choice ${selected ? "is-selected" : ""}"><input type="checkbox" data-character-ancestry-id="${escapeHtml(ancestry.id)}" ${selected ? "checked" : ""} ${disabled ? "disabled" : ""}/><span><strong>${escapeHtml(ancestry.name)}</strong><small>${escapeHtml(ancestry.summary)}</small></span></label>`; }).join("") || `<p class="form-error">Nenhuma ancestralidade encontrada.</p>`}</div>` : `<p class="form-error">Importe um Pack de ancestralidades no Compendium antes de criar a ficha.</p>`}
          ${selectedAncestries.length ? `${hasMixedAncestry ? '<p class="character-creation-selection-hint">Escolha a origem da Feature Top. A Feature Bottom será definida automaticamente pela outra ancestralidade.</p>' : ""}<div class="character-feature-choice-grid"><label class="form-field"><span>Feature Top</span>${topFeatures.length > 1 ? `<select data-character-top-feature>${topFeatures.map((feature) => featureOption(feature, "top", topFeatureId)).join("")}</select>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(topFeatures[0]?.name ?? "Feature indisponivel")}</strong><small>${escapeHtml(topFeatures[0]?.summary ?? "")}</small></div>`}</label><label class="form-field"><span>Feature Bottom</span>${hasMixedAncestry ? `${automaticBottomOrigin}<div class="selected-feature-readonly"><strong>${escapeHtml(selectedBottomFeature?.name ?? "Feature indisponivel")}</strong><small>${escapeHtml(selectedBottomFeature?.summary ?? "")}</small></div>` : bottomFeatures.length > 1 ? `<select data-character-bottom-feature>${bottomFeatures.map((feature) => featureOption(feature, "bottom", bottomFeatureId)).join("")}</select>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(bottomFeatures[0]?.name ?? "Feature indisponivel")}</strong><small>${escapeHtml(bottomFeatures[0]?.summary ?? "")}</small></div>`}</label></div>` : ""}
        </section>
        <section class="character-ancestry-picker creation-step-panel character-feature-step" data-creation-panel="3">
          <div><span>Origem</span><p>${selectedAncestries.length === 2 ? "Escolha a origem da Feature Top. A Feature Bottom será definida automaticamente pela outra ancestralidade." : "As duas Features abaixo foram definidas pela sua ancestralidade."}</p></div>
          <div class="character-feature-choice-grid">
            <label class="form-field"><span>Feature Top</span>${topFeatures.length > 1 ? `<select data-character-top-feature>${topFeatures.map((feature) => featureOption(feature, "top", topFeatureId)).join("")}</select><div class="selected-feature-description"><strong>${escapeHtml(selectedTopFeature?.name ?? "Feature indisponível")}</strong><p>${escapeHtml(selectedTopFeature?.summary ?? "")}</p></div>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(topFeatures[0]?.name ?? "Feature indisponível")}</strong><small>${escapeHtml(topFeatures[0]?.summary ?? "")}</small></div>`}</label>
            <label class="form-field"><span>Feature Bottom</span>${hasMixedAncestry ? `${automaticBottomOrigin}<div class="selected-feature-description"><strong>${escapeHtml(selectedBottomFeature?.name ?? "Feature indisponível")}</strong><p>${escapeHtml(selectedBottomFeature?.summary ?? "")}</p></div>` : bottomFeatures.length > 1 ? `<select data-character-bottom-feature>${bottomFeatures.map((feature) => featureOption(feature, "bottom", bottomFeatureId)).join("")}</select><div class="selected-feature-description"><strong>${escapeHtml(selectedBottomFeature?.name ?? "Feature indisponível")}</strong><p>${escapeHtml(selectedBottomFeature?.summary ?? "")}</p></div>` : `<div class="selected-feature-readonly"><strong>${escapeHtml(bottomFeatures[0]?.name ?? "Feature indisponível")}</strong><small>${escapeHtml(bottomFeatures[0]?.summary ?? "")}</small></div>`}</label>
          </div>
        </section>
        ${renderCreationCommunityStep({ communities: catalog.communities, features: catalog.features, selectedId: state.characterCreationCommunityId, search: state.characterCreationCommunitySearch, packId: state.characterCreationCommunityPackId, getPackDisplayName: (packId) => getPackDisplayName(packId, catalog.packs) }, escapeHtml)}
        ${renderCreationClassStep({ classes, selectedClass, subclasses, selectedSubclassId: selectedSubclass?.id, features: catalog.features }, escapeHtml)}
        ${renderCreationAttributesStep(state.characterCreationAttributeValues, state.characterCreationSelectedAttributeValue, spellcastAttributeId)}
        <section class="character-domain-card-picker creation-step-panel" data-creation-panel="7"><div><span>Loadout inicial</span><h3>Escolha 2 cartas de Domínio</h3><p>Toque em uma carta para selecioná-la e ler o efeito completo. Você pode escolher as duas do mesmo domínio.</p></div><div class="character-domain-card-toolbar"><span>${state.characterCreationCardIds.length} / 2 selecionadas</span><div>${selectedClass.domainIds.map((domainId) => { const domain = findDomain(catalog, domainId); return `<button type="button" class="chip ${selectedCardDomainId === domainId ? "is-active" : ""}" data-character-card-domain-id="${escapeHtml(domainId)}">${escapeHtml(domain?.name ?? "Domínio")}</button>`; }).join("")}</div></div>${eligibleStartingCards.length ? `<div class="character-domain-card-grid">${visibleStartingCards.map((card) => { const selected = state.characterCreationCardIds.includes(card.id); const focused = selected && state.characterCreationFocusedCardId === card.id; return `<button type="button" class="character-domain-card ${selected ? "is-selected" : ""} ${focused ? "is-focused" : ""}" data-character-starting-card-id="${escapeHtml(card.id)}" aria-pressed="${selected}"><span class="character-domain-card-art">${card.image ? `<img src="${escapeHtml(card.image)}" alt="" />` : ""}</span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(findDomain(catalog, card.domainId)?.name ?? "Domínio")} · Nível ${card.tier}</small>${selected ? '<b class="character-domain-card-selected">Selecionada</b>' : ""}<p>${escapeHtml(card.summary)}</p>${focused ? `<span class="character-domain-card-detail">${escapeHtml(card.effect)}</span>` : ""}</button>`; }).join("")}</div>` : `<p class="form-error">Não há cartas de nível 1 para os domínios desta classe. Importe o Pack correspondente antes de criar a ficha.</p>`}</section>
        ${renderCreationExperiencesStep(state.characterCreationExperiences, escapeHtml)}
        ${renderCreationReviewStep({ name: state.characterCreationName, community: catalog.communities.find((entry) => entry.id === state.characterCreationCommunityId)?.name ?? state.characterCreationCommunity, ancestries: selectedAncestries.map((ancestry) => ancestry.name).join(" + "), topFeature: selectedTopFeature?.name, bottomFeature: selectedBottomFeature?.name, attributes: characterCreationAttributes.map((attribute) => ({ label: attribute.label, value: state.characterCreationAttributeValues[attribute.id] })), className: selectedClass.name, subclassName: selectedSubclass?.name, hitPoints: selectedClass.startingHitPoints, evasion: selectedClass.startingEvasion, cards: state.characterCreationCardIds.map((id) => catalog.cards.find((card) => card.id === id)?.name ?? "").filter(Boolean).join(" · "), experiences: state.characterCreationExperiences.map((experience) => experience.name).filter(Boolean).join(" · ") }, escapeHtml)}
        ${state.characterCreationError ? `<p class="form-error">${escapeHtml(state.characterCreationError)}</p>` : ""}
        </div>
        ${renderCreationActions({ step: state.characterCreationStep, nextDisabled: needsAncestrySelection, nextDescribedBy: needsAncestrySelection ? "character-ancestry-selection-hint" : undefined })}
      </form>
    </div>
  `;
}
