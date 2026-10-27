// "Affiliated with" badges - from content/affiliations/.
//
// Outside src/ on purpose: these are entries, not pages, and the build tools
// treat anything under src/content/ as a page.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/affiliations";

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
    if (!data || data.published === false || !data.logo) continue;
    out.push(data);
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.name || "").localeCompare(String(b.name || "")));
}
