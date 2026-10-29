// Happy clients - from content/clients/.
//
// "title" is what the dashboard names its files after; older entries were
// saved with "name". Both are accepted so nothing saved before has to be
// touched by hand.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/clients";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const out = [];
  for (const file of names) {
    let text = "";
    try { text = fs.readFileSync(`${DIR}/${file}`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false) continue;

    const title = String(data.title || data.name || "").trim();
    if (!title) continue;

    out.push({ ...data, name: title, title });
  }

  return out.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.title || "").localeCompare(String(b.title || "")));
}
