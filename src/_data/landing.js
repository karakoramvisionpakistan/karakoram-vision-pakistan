// Hub pages ka mawad - CMS ki likhi hui files se.
//
// src/content/landing/ ki har file ek hub page ka mawad rakhti hai. Yahan
// unhein parh kar ek fehrist bana dete hain jis ki kunji page ka pata hai,
// taake template seedha landing[page.url] likh kar apna mawad le sake.
//
// Yeh files khud koi page nahi banatin - eleventy.config.js mein unhein
// nazarandaz kar diya gaya hai. Woh sirf mawad hain.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "src/content/landing";

export default function () {
  const out = {};
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return out; }

  for (const name of names) {
    let text = "";
    try { text = fs.readFileSync(`${DIR}/${name}`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || !data.url) continue;
    out[String(data.url)] = data;
  }
  return out;
}
