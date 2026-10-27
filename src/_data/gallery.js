// Photo albums - from content/gallery/.
//
// Outside src/ on purpose: these are entries, not pages, and the build tools
// treat anything under src/content/ as a page.
//
// Each album keeps its photos together; the page flattens them into one grid
// and uses the album name for the filter chips.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/gallery";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const out = [];
  for (const name of names) {
    let text = "";
    try { text = fs.readFileSync(`${DIR}/${name}`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false) continue;

    const photos = (data.photos || []).filter(Boolean);
    if (!photos.length) continue;              // khali album dikhane ka koi faida nahi
    out.push({ ...data, photos, count: photos.length });
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.title || "").localeCompare(String(b.title || "")));
}
