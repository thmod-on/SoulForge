import { demoCharacter } from "./demoCharacter";

/**
 * Ficha limpa para validar packs locais atuais sem alterar a ficha-demo
 * historica do Kael. Ela e criada somente neste dispositivo, como o Kael
 * original, e pode ser removida pela tela de selecao de personagens.
 */
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
