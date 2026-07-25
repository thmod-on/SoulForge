import manifest from "../../packs/demo/manifest.json";
import dread from "../../packs/demo/domains/domain.dread.json";
import dreadMark from "../../packs/demo/cards/card.dread-mark.json";
import dreadVeil from "../../packs/demo/cards/card.dread-veil.json";
import inspirationalWords from "../../packs/demo/cards/card.inspirational-words.json";
import lastStand from "../../packs/demo/cards/card.last-stand.json";
import shieldBlock from "../../packs/demo/cards/card.shield-block.json";
import shadowBargain from "../../packs/demo/cards/card.shadow-bargain.json";
import stalwartAdvance from "../../packs/demo/cards/card.stalwart-advance.json";
import gold from "../../packs/demo/items/item.gold.json";
import healingPotion from "../../packs/demo/items/item.healing-potion.json";
import leatherArmor from "../../packs/demo/items/item.leather-armor.json";
import longSword from "../../packs/demo/items/item.long-sword.json";
import rope from "../../packs/demo/items/item.rope.json";
import shadowEssence from "../../packs/demo/items/item.shadow-essence.json";
import steelShield from "../../packs/demo/items/item.steel-shield.json";
import torch from "../../packs/demo/items/item.torch.json";
import vigilAmulet from "../../packs/demo/items/item.vigil-amulet.json";
import { createCatalog } from "../domain/catalog";
import type { Definition, PackManifest } from "../domain/types";

export const catalog = createCatalog([manifest as PackManifest], [
  dread,
  shieldBlock,
  stalwartAdvance,
  dreadVeil,
  dreadMark,
  shadowBargain,
  inspirationalWords,
  lastStand,
  longSword,
  steelShield,
  leatherArmor,
  vigilAmulet,
  healingPotion,
  rope,
  torch,
  gold,
  shadowEssence
] as Definition[]);
