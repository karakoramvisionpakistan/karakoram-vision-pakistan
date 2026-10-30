// Photo albums.
//
// Two sources, in this order:
//
//   content/gallery/   albums you put together by hand
//   src/content/...    every photo already attached to a journey
//
// The second one is the point: a trek's cover photo and its gallery are
// already in the CMS, so asking anyone to upload them again for the gallery
// would be busy-work - and the two copies would drift apart.
//
// A photo that appears in both is shown once, in the hand-made album, because
// that is where someone chose to put it.
import fs from "node:fs";
import yaml from "js-yaml";

const BY_HAND = "content/gallery";

// folder -> the name shown on the filter button
const JOURNEYS = [
  ["tours", "Tours"],
  ["trekking", "Trekking"],
  ["expeditions", "Expeditions"],
  ["jeep-safaris", "Jeep Safaris"],
  ["hunting-services", "Hunting"],
  ["vehicles", "Vehicles"],
  ["pages", "Destinations"],
];

function frontMatter(file) {
  let text = "";
  try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  try { return yaml.load(text.slice(3, end)); } catch { return null; }
}

// A drawing standing in for a missing photo is not worth showing.
const real = (src) => {
  const s = String(src || "").trim();
  return s && !/\.svg(\?|$)/i.test(s) && !/placeholder/i.test(s);
};

export default function () {
  const albums = [];
  const seen = new Set();

  // ---- by hand
  let names = [];
  try { names = fs.readdirSync(BY_HAND).filter((f) => f.endsWith(".md")); } catch {}
  for (const name of names) {
    const data = frontMatter(`${BY_HAND}/${name}`);
    if (!data || data.published === false) continue;
    const photos = (data.photos || []).filter(real);
    if (!photos.length) continue;
    photos.forEach((p) => seen.add(p));
    albums.push({ ...data, photos, count: photos.length, source: "manual" });
  }
  albums.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.title || "").localeCompare(String(b.title || "")));

  // ---- from the journeys
  for (const [folder, label] of JOURNEYS) {
    const dir = `src/content/${folder}`;
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }

    const photos = [];
    for (const file of files.sort()) {
      const data = frontMatter(`${dir}/${file}`);
      if (!data || data.published === false) continue;
      for (const src of [data.cover_image, ...(data.gallery || [])]) {
        if (!real(src) || seen.has(src)) continue;
        seen.add(src);
        photos.push(src);
      }
    }
    if (photos.length) albums.push({ title: label, photos, count: photos.length, source: "journeys" });
  }

  return albums;
}
