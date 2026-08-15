import manifest from "../../packs/demo/manifest.json";
import testDomain from "../../packs/demo/domains/domain.test.json";
import guardian from "../../packs/demo/domains/domain.guardian.json";
import dreadMark from "../../packs/demo/cards/card.dread-mark.json";
import dreadVeil from "../../packs/demo/cards/card.dread-veil.json";
import inspirationalWords from "../../packs/demo/cards/card.inspirational-words.json";
import lastStand from "../../packs/demo/cards/card.last-stand.json";
import shieldBlock from "../../packs/demo/cards/card.shield-block.json";
import guardiansWard from "../../packs/demo/cards/card.guardians-ward.json";
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
import wandererCommunity from "../../packs/demo/communities/community.wanderer.json";
import wandererFeature from "../../packs/demo/features/feature.wanderer-way.json";
import { createCatalog } from "../domain/catalog";
import type { Definition, PackManifest } from "../domain/types";

export const baseCatalog = createCatalog([manifest as PackManifest], [
  testDomain,
  guardian,
  shieldBlock,
  guardiansWard,
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
  ,wandererCommunity,
  wandererFeature
] as Definition[]);

// Compatibilidade para consumidores que precisam apenas do catalogo dos packs instalados.
export const catalog = baseCatalog;
