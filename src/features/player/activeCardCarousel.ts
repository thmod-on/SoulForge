export type ActiveCardCarouselState = {
  hasOverflow: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
};

export function getActiveCardCarouselState(scrollLeft: number, scrollWidth: number, clientWidth: number): ActiveCardCarouselState {
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  const hasOverflow = maxScrollLeft > 2;
  return {
    hasOverflow,
    hasPrevious: hasOverflow && scrollLeft > 2,
    hasNext: hasOverflow && scrollLeft < maxScrollLeft - 2
  };
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

export function setupActiveCardCarousel(root: ParentNode): void {
  const track = root.querySelector<HTMLElement>("[data-active-card-carousel]");
  if (!track) return;
  track.addEventListener("scroll", () => syncControls(root, track), { passive: true });
  requestAnimationFrame(() => syncControls(root, track));
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
