import { demoCharacter } from "./demoCharacter";

export const legacyDemoCharacterId = demoCharacter.id;

/** Ficha de demonstração oficial mantida e restaurada pelo SoulForge. */
export const demoKaelII = {
  ...demoCharacter,
  id: "character.kael-ironheart-ii",
  identity: {
    ...demoCharacter.identity,
    name: "Kael II",
    className: "Serafim",
    primaryClassId: "class.core.serafim",
    subclassName: "Portador Divino",
    primarySubclassId: "subclass.core.serafim.portador-divino"
  },
  gameMarkers: undefined
};
