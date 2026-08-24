const boundRegions = new WeakSet<HTMLElement>();
const observedRegions = new Set<HTMLElement>();

const resizeObserver = typeof ResizeObserver === "undefined"
  ? undefined
  : new ResizeObserver((entries) => entries.forEach((entry) => updateScrollState(entry.target as HTMLElement)));

function isVerticallyScrollable(element: HTMLElement): boolean {
  const overflow = getComputedStyle(element).overflowY;
  return overflow === "auto" || overflow === "scroll";
}

function updateScrollState(element: HTMLElement): void {
  const overflowAmount = element.scrollHeight - element.clientHeight;
  const hasOverflow = overflowAmount > 1;
  const canScrollUp = hasOverflow && element.scrollTop > 1;
  const canScrollDown = hasOverflow && element.scrollTop < overflowAmount - 1;

  element.classList.toggle("has-scroll-overflow", hasOverflow);
  element.classList.toggle("can-scroll-up", canScrollUp);
  element.classList.toggle("can-scroll-down", canScrollDown);
}

function registerScrollRegion(element: HTMLElement): void {
  element.classList.add("sf-scroll-region");
  updateScrollState(element);
  if (!boundRegions.has(element)) {
    boundRegions.add(element);
    element.addEventListener("scroll", () => updateScrollState(element), { passive: true });
    resizeObserver?.observe(element);
    observedRegions.add(element);
  }
}

/**
 * Aplica a identidade visual de rolagem às áreas internas que realmente usam
 * overflow vertical. A lista é reavaliada após cada renderização da interface.
 */
export function syncScrollAffordances(root: ParentNode): void {
  observedRegions.forEach((element) => {
    if (!root.contains(element)) {
      resizeObserver?.unobserve(element);
      observedRegions.delete(element);
    }
  });

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (isVerticallyScrollable(element)) registerScrollRegion(element);
  });

  requestAnimationFrame(() => {
    root.querySelectorAll<HTMLElement>(".sf-scroll-region").forEach(updateScrollState);
  });
}
