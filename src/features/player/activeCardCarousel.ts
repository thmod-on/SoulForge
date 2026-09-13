export type ActiveCardCarouselState = {
  hasOverflow: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type ActiveCardCarouselSnapshot = {
  scrollLeft: number;
  focusedCardId?: string;
};

export type ActiveCardCarouselSetupOptions = {
  snapshot?: ActiveCardCarouselSnapshot;
  restoreFocus?: boolean;
  onChange?: (snapshot: ActiveCardCarouselSnapshot) => void;
};

const rememberedCarousels = new Map<string, ActiveCardCarouselSnapshot>();

export function getActiveCardCarouselState(scrollLeft: number, scrollWidth: number, clientWidth: number): ActiveCardCarouselState {
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  const hasOverflow = maxScrollLeft > 2;
  return {
    hasOverflow,
    hasPrevious: hasOverflow && scrollLeft > 2,
    hasNext: hasOverflow && scrollLeft < maxScrollLeft - 2
  };
}

export function getActiveCardCarouselRestoreLeft(scrollLeft: number, scrollWidth: number, clientWidth: number): number {
  return Math.min(Math.max(0, scrollLeft), Math.max(0, scrollWidth - clientWidth));
}

function syncControls(root: ParentNode, track?: HTMLElement | null): void {
  const carouselTrack = track ?? root.querySelector<HTMLElement>("[data-active-card-carousel]");
  if (!carouselTrack) return;
  const carousel = carouselTrack.closest<HTMLElement>(".active-card-rail");
  const previous = carousel?.querySelector<HTMLButtonElement>('[data-active-card-direction="-1"]');
  const next = carousel?.querySelector<HTMLButtonElement>('[data-active-card-direction="1"]');
  const carouselState = getActiveCardCarouselState(carouselTrack.scrollLeft, carouselTrack.scrollWidth, carouselTrack.clientWidth);
  if (previous) previous.hidden = !carouselState.hasPrevious;
  if (next) next.hidden = !carouselState.hasNext;
  carousel?.classList.toggle("has-previous", carouselState.hasPrevious);
  carousel?.classList.toggle("has-next", carouselState.hasNext);
}

export function captureActiveCardCarousel(root: ParentNode, focusedCardId?: string): ActiveCardCarouselSnapshot | undefined {
  const track = root.querySelector<HTMLElement>("[data-active-card-carousel]");
  if (!track) return undefined;
  const activeCard = track.ownerDocument.activeElement?.closest<HTMLElement>("[data-card-modal-id]");
  return {
    scrollLeft: track.scrollLeft,
    focusedCardId: focusedCardId ?? (activeCard && track.contains(activeCard) ? activeCard.dataset.cardModalId : undefined)
  };
}

export function setupActiveCardCarousel(root: ParentNode, options: ActiveCardCarouselSetupOptions = {}): void {
  const track = root.querySelector<HTMLElement>("[data-active-card-carousel]");
  if (!track) return;
  track.addEventListener("scroll", () => {
    syncControls(root, track);
    options.onChange?.({ scrollLeft: track.scrollLeft, focusedCardId: options.snapshot?.focusedCardId });
  }, { passive: true });
  requestAnimationFrame(() => {
    if (options.snapshot) {
      track.scrollLeft = getActiveCardCarouselRestoreLeft(options.snapshot.scrollLeft, track.scrollWidth, track.clientWidth);
    }
    syncControls(root, track);
    if (options.restoreFocus && options.snapshot?.focusedCardId) {
      const focusedCard = [...track.querySelectorAll<HTMLElement>("[data-card-modal-id]")]
        .find((card) => card.dataset.cardModalId === options.snapshot?.focusedCardId);
      focusedCard?.focus({ preventScroll: true });
    }
  });
}

export function rememberActiveCardCarousel(root: ParentNode, characterId: string, focusedCardId?: string): void {
  const snapshot = captureActiveCardCarousel(root, focusedCardId);
  if (!snapshot) return;
  rememberedCarousels.set(characterId, {
    ...snapshot,
    focusedCardId: snapshot.focusedCardId ?? rememberedCarousels.get(characterId)?.focusedCardId
  });
}

export function setupRememberedActiveCardCarousel(root: ParentNode, characterId: string, restoreFocus = false): void {
  setupActiveCardCarousel(root, {
    snapshot: rememberedCarousels.get(characterId),
    restoreFocus,
    onChange: (snapshot) => rememberedCarousels.set(characterId, {
      ...snapshot,
      focusedCardId: snapshot.focusedCardId ?? rememberedCarousels.get(characterId)?.focusedCardId
    })
  });
}

export function isRememberedActiveCard(characterId: string | undefined, cardId: string | undefined): boolean {
  return Boolean(characterId && cardId && rememberedCarousels.get(characterId)?.focusedCardId === cardId);
}

export function scrollActiveCardCarousel(root: ParentNode, direction: number): void {
  const track = root.querySelector<HTMLElement>("[data-active-card-carousel]");
  const card = track?.querySelector<HTMLElement>(".ability-card");
  if (!track || !card) return;
  const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
  track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
}

export function syncActiveCardCarousel(root: ParentNode): void {
  syncControls(root);
}
