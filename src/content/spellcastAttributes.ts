import type { Attribute, SubclassDefinition } from "../domain/types";

/**
 * Metadados explícitos para fichas criadas antes de o atributo de Conjuração
 * passar a integrar todos os packs. Não há interpretação de texto de regra.
 */
const knownSpellcastAttributes: Record<string, Attribute["id"]> = {
  "subclass.core.bardo.trovador": "con",
  "subclass.core.bardo.mestre-das-palavras": "con",
  "subclass.core.druida.guardiao-dos-elementos": "wil",
  "subclass.core.druida.guardiao-da-renovacao": "wil",
  "subclass.core.ranger.vinculo-bestial": "dex",
  "subclass.core.ranger.desbravador": "dex",
  "subclass.core.ladino.caminhante-da-noite": "cha",
  "subclass.core.ladino.sindicato": "cha",
  "subclass.core.serafim.portador-divino": "for",
  "subclass.core.serafim.sentinela-alada": "for",
  "subclass.core.feiticeiro.origem-elemental": "wil",
  "subclass.core.feiticeiro.origem-primordial": "wil",
  "subclass.core.mago.escola-do-conhecimento": "int",
  "subclass.core.mago.escola-da-guerra": "int",
  "subclass.hope-fear.assassin.guilda-dos-executores": "dex",
  "subclass.hope-fear.assassin.guilda-dos-envenenadores": "int",
  "subclass.hope-fear.warlock.pacto-do-eterno": "con",
  "subclass.hope-fear.warlock.pacto-do-irado": "con",
  "subclass.hope-fear.witch.hedge": "int",
  "subclass.hope-fear.witch.lua": "wil"
};

export function getSpellcastAttributeId(subclassId?: string, subclass?: SubclassDefinition): Attribute["id"] | undefined {
  return subclass?.spellcastAttributeId ?? (subclassId ? knownSpellcastAttributes[subclassId] : undefined);
}
