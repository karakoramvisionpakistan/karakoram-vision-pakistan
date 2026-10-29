// The team - from content/team/, grouped the way you named the groups.
//
// "title" is what the dashboard names its files after; older entries were
// saved with "name". Both are accepted.
import fs from "node:fs";
import yaml from "js-yaml";

const DIR = "content/team";

export default function () {
  let names = [];
  try { names = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { return []; }

  const people = [];
  for (const file of names) {
    let text = "";
    try { text = fs.readFileSync(`${DIR}/${file}`, "utf8"); } catch { continue; }
    if (!text.startsWith("---")) continue;
    const end = text.indexOf("\n---", 3);
    if (end < 0) continue;
    let data;
    try { data = yaml.load(text.slice(3, end)); } catch { continue; }
    if (!data || data.published === false) continue;

    const name = String(data.title || data.name || "").trim();
    if (!name) continue;
    people.push({ ...data, name });
  }

  people.sort((a, b) =>
    (Number(a.order || 0) - Number(b.order || 0))
    || String(a.name || "").localeCompare(String(b.name || "")));

  const groups = [];
  for (const person of people) {
    const title = String(person.section || "Our Team").trim() || "Our Team";
    let group = groups.find((g) => g.title === title);
    if (!group) { group = { title, people: [] }; groups.push(group); }
    group.people.push(person);
  }
  return groups;
}
