import { syncScrollAffordances } from "./scrollAffordance";

export function patchSurface(root: HTMLElement, selector: string, markup: string, options: { scrollSelector?: string; resetScroll?: boolean; syncScroll?: boolean } = {}): boolean {
  const current = root.querySelector<Element>(selector);
  if (!current) return false;
  const scrollTop = options.resetScroll ? 0 : options.scrollSelector ? root.querySelector<HTMLElement>(options.scrollSelector)?.scrollTop ?? 0 : undefined;
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const next = template.content.querySelector<Element>(selector);
  if (!next) return false;
  patchElement(current, next);
  if (options.syncScroll !== false) syncScrollAffordances(root);
  if (scrollTop !== undefined && options.scrollSelector) requestAnimationFrame(() => { const scroll = root.querySelector<HTMLElement>(options.scrollSelector!); if (scroll) scroll.scrollTop = scrollTop; });
  return true;
}

function patchElement(current: Element, next: Element): void {
  for (const attribute of [...current.attributes]) if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  for (const attribute of [...next.attributes]) if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
  const currentChildren = [...current.childNodes], nextChildren = [...next.childNodes], count = Math.max(currentChildren.length, nextChildren.length);
  for (let index = 0; index < count; index += 1) {
    const oldNode = currentChildren[index], newNode = nextChildren[index];
    if (!oldNode && newNode) { current.append(newNode.cloneNode(true)); continue; }
    if (oldNode && !newNode) { oldNode.remove(); continue; }
    if (!oldNode || !newNode) continue;
    if (oldNode.nodeType !== newNode.nodeType || (oldNode instanceof Element && newNode instanceof Element && oldNode.tagName !== newNode.tagName)) { oldNode.replaceWith(newNode.cloneNode(true)); continue; }
    if (oldNode.nodeType === Node.TEXT_NODE) { if (oldNode.textContent !== newNode.textContent) oldNode.textContent = newNode.textContent; continue; }
    if (oldNode instanceof Element && newNode instanceof Element) { patchElement(oldNode, newNode); syncControlValue(oldNode, newNode); }
  }
}

function syncControlValue(current: Element, next: Element): void {
  if (current instanceof HTMLInputElement && next instanceof HTMLInputElement) {
    if (current.type === "checkbox" || current.type === "radio") current.checked = next.checked;
    else if (document.activeElement !== current) current.value = next.value;
  }
  if (current instanceof HTMLSelectElement && next instanceof HTMLSelectElement) current.value = next.value;
  if (current instanceof HTMLTextAreaElement && next instanceof HTMLTextAreaElement && document.activeElement !== current) current.value = next.value;
}
