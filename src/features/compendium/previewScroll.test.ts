import { describe, expect, it, vi } from "vitest";
import { handleAncestryAction, type AncestryFeatureDependencies } from "./ancestries";
import { handleCommunityAction, type CommunityFeatureDependencies } from "./communities";

describe("Compendium preview scroll", () => {
  it("preserves scroll and search when opening an ancestry", () => {
    const render = vi.fn();
    const state = { compendiumAncestrySearch: "humano", ancestryModalOpen: false };
    const target = { closest: () => ({ dataset: { ancestryPreviewId: "ancestry.test" } }) } as unknown as HTMLElement;
    expect(handleAncestryAction(target, { state, render } as unknown as AncestryFeatureDependencies)).toBe(true);
    expect(render).toHaveBeenCalledWith({ preserveMainScroll: true });
    expect(state.compendiumAncestrySearch).toBe("humano");
    expect(state).toHaveProperty("compendiumAncestryPreviewId", "ancestry.test");
  });

  it("preserves scroll when opening a community", () => {
    const render = vi.fn();
    const state = {};
    const target = { closest: (selector: string) => selector === "[data-community-preview-id]" ? { dataset: { communityPreviewId: "community.test" } } : null } as unknown as HTMLElement;
    expect(handleCommunityAction(target, { state, render } as unknown as CommunityFeatureDependencies)).toBe(true);
    expect(render).toHaveBeenCalledWith({ preserveMainScroll: true });
    expect(state).toHaveProperty("compendiumCommunityPreviewId", "community.test");
  });
});
