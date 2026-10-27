import { gzipSync } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const clientDirectory = path.resolve("dist/client");
const limits = {
  javascriptGzip: 150 * 1024,
  cssGzip: 50 * 1024,
  precache: 10 * 1024 * 1024
};

const serviceWorker = await readFile(path.join(clientDirectory, "sw.js"), "utf8");
const urls = [...new Set([...serviceWorker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]))];
if (!urls.length) throw new Error("Não foi possível localizar o precache no Service Worker gerado.");

const precacheBytes = await Promise.all(urls.map(async (url) => {
  const file = path.join(clientDirectory, ...url.split("/"));
  return (await stat(file)).size;
}));
const assets = urls.filter((url) => url.startsWith("assets/"));
const javascript = assets.filter((url) => url.endsWith(".js"));
const css = assets.filter((url) => url.endsWith(".css"));
const compressedSize = async (urlsToMeasure) => (await Promise.all(urlsToMeasure.map(async (url) => gzipSync(await readFile(path.join(clientDirectory, ...url.split("/")))).byteLength))).reduce((total, size) => total + size, 0);
const javascriptGzip = await compressedSize(javascript);
const cssGzip = await compressedSize(css);
const totalPrecache = precacheBytes.reduce((total, size) => total + size, 0);

const format = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
console.log(`Performance baseline: JS gzip ${format(javascriptGzip)}, CSS gzip ${format(cssGzip)}, precache ${format(totalPrecache)}.`);
const failures = [
  ["JavaScript comprimido", javascriptGzip, limits.javascriptGzip],
  ["CSS comprimido", cssGzip, limits.cssGzip],
  ["Precache", totalPrecache, limits.precache]
].filter(([, actual, limit]) => actual > limit);
if (failures.length) throw new Error(failures.map(([label, actual, limit]) => `${label}: ${format(actual)} excede ${format(limit)}.`).join(" "));
