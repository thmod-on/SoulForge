const boundRegions = new WeakSet<HTMLElement>();
const observedRegions = new Set<HTMLElement>();

const resizeObserver = typeof ResizeObserver === "undefined"
  ? undefined
  : new ResizeObserver((entries) => entries.forEach((entry) => updateScrollState(entry.target as HTMLElement)));

function isVerticallyScrollable(element: HTMLElement): boolean {
  const overflow = getComputedStyle(element).overflowY;
  return overflow === "auto" || overflow === "scroll";
}

export function getScrollState(scrollHeight: number, clientHeight: number, scrollTop: number): { hasOverflow: boolean; canScrollUp: boolean; canScrollDown: boolean } {
  const overflowAmount = scrollHeight - clientHeight;
  const hasOverflow = overflowAmount > 1;
  return {
    hasOverflow,
    canScrollUp: hasOverflow && scrollTop > 1,
    canScrollDown: hasOverflow && scrollTop < overflowAmount - 1
  };
}

export function updateScrollState(element: HTMLElement): void {
  const { hasOverflow, canScrollUp, canScrollDown } = getScrollState(element.scrollHeight, element.clientHeight, element.scrollTop);

  element.classList.toggle("has-scroll-overflow", hasOverflow);
  element.classList.toggle("can-scroll-up", canScrollUp);
  element.classList.toggle("can-scroll-down", canScrollDown);
}

function refreshObservedRegions(): void {
  observedRegions.forEach((element) => updateScrollState(element));
}

let viewportEventsBound = false;

function bindViewportEvents(): void {
  if (viewportEventsBound || typeof window === "undefined") return;
  viewportEventsBound = true;
  let frame = 0;
  const scheduleRefresh = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => requestAnimationFrame(refreshObservedRegions));
  };
  window.addEventListener("resize", scheduleRefresh, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleRefresh, { passive: true });
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
  bindViewportEvents();
  observedRegions.forEach((element) => {
    if (!root.contains(element)) {
      resizeObserver?.unobserve(element);
      observedRegions.delete(element);
    }
  });

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (isVerticallyScrollable(element)) registerScrollRegion(element);
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll<HTMLElement>(".sf-scroll-region").forEach(updateScrollState);
  }));
}
