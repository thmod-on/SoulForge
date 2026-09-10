function syncControls(root: ParentNode, track?: HTMLElement | null): void {
  const carouselTrack = track ?? root.querySelector<HTMLElement>("[data-character-carousel]");
  if (!carouselTrack) return;
  const carousel = carouselTrack.closest<HTMLElement>(".character-select-carousel");
  const previous = carousel?.querySelector<HTMLButtonElement>('[data-carousel-direction="-1"]');
  const next = carousel?.querySelector<HTMLButtonElement>('[data-carousel-direction="1"]');
  const maxScrollLeft = Math.max(0, carouselTrack.scrollWidth - carouselTrack.clientWidth);
  const hasOverflow = maxScrollLeft > 2;
  const hasPrevious = hasOverflow && carouselTrack.scrollLeft > 2;
  const hasNext = hasOverflow && carouselTrack.scrollLeft < maxScrollLeft - 2;
  if (previous) previous.hidden = !hasPrevious;
  if (next) next.hidden = !hasNext;
  carousel?.classList.toggle("has-previous", hasPrevious);
  carousel?.classList.toggle("has-next", hasNext);
}

export function setupCharacterCarousel(root: ParentNode): void {
  const track = root.querySelector<HTMLElement>("[data-character-carousel]");
  if (!track) return;
  track.addEventListener("scroll", () => syncControls(root, track), { passive: true });
  requestAnimationFrame(() => syncControls(root, track));
}

export function scrollCharacterCarousel(root: ParentNode, direction: number): void {
  const track = root.querySelector<HTMLElement>("[data-character-carousel]");
  const card = track?.querySelector<HTMLElement>(".character-select-entry");
  if (!track || !card) return;
  const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
  track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
}

export function syncCharacterCarousel(root: ParentNode): void {
  syncControls(root);
}
