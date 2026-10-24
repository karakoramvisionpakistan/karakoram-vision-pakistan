// Do kaam karta hai:
//   1. Har page ki cover image ka alt text theek karta hai (Google images + accessibility).
//   2. Har journey page ke aakhir mein "Related journeys" links daalta hai (internal linking).
//   node tools/apply-page-extras.mjs           -> sirf dikhata hai
//   node tools/apply-page-extras.mjs --write   -> files badal deta hai
// Dobara chalane par links duplicate nahi hote - purana block replace ho jata hai.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

const ALT = {
  "src/content/trekking/k2-base-camp-baltoro-trek.md":
    "Trekkers on the Baltoro Glacier with K2 rising at the head of the valley",
  "src/content/trekking/gondogoro-la-circuit-trek.md":
    "Climbers crossing the snow slopes of Gondogoro La above the Baltoro",
  "src/content/trekking/biafo-hisper-trek.md":
    "Trekkers roped together on the Biafo Glacier below Snow Lake",
  "src/content/trekking/fairy-meadows-nanga-parbat-base-camp-trek.md":
    "Green meadows at Fairy Meadows below the Raikot face of Nanga Parbat",
  "src/content/trekking/rakaposhi-base-camp-trek.md":
    "Rakaposhi base camp meadow below the glacier in Nagar valley",
  "src/content/trekking/rush-lake-trek.md":
    "Rush Lake reflecting the Karakoram peaks above Nagar valley",
  "src/content/trekking/nangma-valley-trek.md":
    "Granite walls above the green floor of Nangma Valley near Kanday",
  "src/content/trekking/majrooh-top-trek.md":
    "Karakoram panorama from Majrooh Top above Skardu",
  "src/content/trekking/thalle-la-trek.md":
    "Summer pastures on the Thalle La route between Shigar and Khaplu",
  "src/content/expeditions/k2-expediiton.md":
    "K2 seen from base camp on the Godwin-Austen Glacier in Pakistan",
  "src/content/expeditions/broad-peak-expedition.md":
    "Broad Peak above the Baltoro Glacier in the Karakoram",
  "src/content/expeditions/gasherbrum-ii-expedition.md":
    "Gasherbrum II snow slopes seen from the upper Baltoro",
  "src/content/expeditions/ghasherbrum-1.md":
    "Gasherbrum I, Hidden Peak, at the head of the Baltoro Glacier",
  "src/content/expeditions/nanga-parbat-expedition.md":
    "Nanga Parbat rising above the Diamir valley in northern Pakistan",
  "src/content/expeditions/laila-peak-expedition.md":
    "The blade-shaped summit of Laila Peak above the Gondogoro Glacier",
  "src/content/expeditions/spantik-peak-expedition.md":
    "Spantik, the Golden Peak, lit by evening light above Nagar",
  "src/content/expeditions/trango-expedition.md":
    "The granite towers of Trango above the Baltoro Glacier",
  "src/content/tours/hunza-valley-heritage-tour.md":
    "Baltit Fort above Karimabad with the Hunza valley below",
  "src/content/tours/autumn-hunza-skardu-tour.md":
    "Autumn colour in the orchards of Hunza below snow-covered peaks",
  "src/content/tours/spring-bloosom-tour.md":
    "Apricot blossom in a Hunza village with the Karakoram behind",
  "src/content/tours/gilgit-baltistan-grand-circuit.md":
    "The Karakoram Highway winding through the mountains of Gilgit-Baltistan",
  "src/content/tours/deosai-khaplu-tour.md":
    "Sheosar Lake on the Deosai plateau under an open sky",
  "src/content/tours/fairy-meadows-nanga-parbat-tour.md":
    "View of Nanga Parbat from the meadow at Fairy Meadows",
  "src/content/tours/skardu-shigar-valley-explorer.md":
    "Upper Kachura Lake near Skardu surrounded by mountains",
  "src/content/jeep-safaris/deosai-jeep-safari.md":
    "A 4x4 jeep crossing the open grassland of the Deosai plateau",
  "src/content/jeep-safaris/shigar-basho-khaplu-jeep-adventure.md":
    "Jeep track through the green meadows of Basho valley near Shigar",
  "src/content/jeep-safaris/untitled.md":
    "Mountain road winding between villages in northern Pakistan",
  "src/content/vehicles/toyota-prado-4x4.md":
    "Toyota Prado 4x4 on a mountain road in Gilgit-Baltistan",
  "src/content/vehicles/toyota-hiace-van.md":
    "Toyota Hiace van parked on the Karakoram Highway",
  "src/content/vehicles/coaster-group-transport.md":
    "Coaster bus carrying a tour group through northern Pakistan",
  "src/content/hunting-services/permit-mountain-expedition-logistics.md":
    "Himalayan ibex on a rocky ridge in Gilgit-Baltistan",
  "src/content/pages/destination-skardu.md":
    "Skardu valley and the Indus river seen from above",
  "src/content/pages/destination-hunza.md":
    "Hunza valley with Rakaposhi rising above the terraced fields",
  "src/content/pages/destination-deosai.md":
    "Wildflowers across the Deosai plateau in summer",
  "src/content/pages/destination-fairy-meadows.md":
    "Wooden huts at Fairy Meadows facing Nanga Parbat",
  "src/content/pages/destination-khaplu.md":
    "Khaplu Palace above the Shyok valley in Baltistan",
  "src/content/pages/destination-shigar.md":
    "Shigar Fort and the valley on the road toward Askole",
  "src/content/pages/about-us.md":
    "The Karakoram Vision Pakistan team at the office in Skardu",
  "src/content/pages/why-choose-us.md":
    "A local guide with travellers on a mountain trail in Gilgit-Baltistan",
  "src/content/pages/faqs.md":
    "Travellers planning a route on a map in northern Pakistan",
  "src/content/pages/equipment-check-list.md":
    "Trekking equipment laid out before a Karakoram expedition",
  "src/content/pages/family-trip.md":
    "A family on a mountain viewpoint in northern Pakistan",
  "src/content/pages/refund-policy.md":
    "Karakoram Vision Pakistan travel documents and planning notes",
  "src/content/pages/privacy-policy.md":
    "Karakoram Vision Pakistan office desk with travel paperwork",
  "src/content/pages/terms-and-conditions.md":
    "Travel booking documents for a Karakoram Vision Pakistan journey",
  "src/content/blog/best-time-to-visit-skardu.md":
    "Autumn colour along the Indus river near Skardu",
  "src/content/blog/northern-pakistan-packing-checklist.md":
    "Trekking clothing and gear packed for a journey in the Karakoram",
  "src/content/blog/prepare-for-k2-base-camp-trek.md":
    "A trekker walking the moraine of the Baltoro Glacier toward Concordia",
  "src/content/blog/responsible-travel-gilgit-baltistan.md":
    "Porters and trekkers on a mountain trail in Gilgit-Baltistan",
};
const RELATED = {
  "src/content/trekking/k2-base-camp-baltoro-trek.md": [
    ["/trekking/gondogoro-la-circuit-trek/", "Gondogoro La circuit trek"],
    ["/expeditions/k2-expedition/", "K2 expedition"],
    ["/blog/prepare-for-k2-base-camp-trek/", "How to prepare for the K2 base camp trek"],
  ],
  "src/content/trekking/gondogoro-la-circuit-trek.md": [
    ["/trekking/k2-base-camp-trek/", "K2 base camp trek"],
    ["/trekking/biafo-hispar-trek/", "Biafo Hispar Pass trek"],
    ["/destinations/skardu/", "Skardu travel guide"],
  ],
  "src/content/trekking/biafo-hisper-trek.md": [
    ["/trekking/gondogoro-la-circuit-trek/", "Gondogoro La circuit trek"],
    ["/destinations/hunza/", "Hunza valley guide"],
    ["/destinations/shigar/", "Shigar valley guide"],
  ],
  "src/content/trekking/fairy-meadows-nanga-parbat-base-camp-trek.md": [
    ["/tours/fairy-meadows-nanga-parbat-tour/", "Fairy Meadows tour"],
    ["/destinations/fairy-meadows/", "Fairy Meadows travel guide"],
    ["/expeditions/nanga-parbat-expedition/", "Nanga Parbat expedition"],
  ],
  "src/content/trekking/rakaposhi-base-camp-trek.md": [
    ["/tours/hunza-valley-heritage-tour/", "Hunza valley tour"],
    ["/trekking/rush-lake-trek/", "Rush Lake trek"],
    ["/destinations/hunza/", "Hunza valley guide"],
  ],
  "src/content/trekking/rush-lake-trek.md": [
    ["/trekking/rakaposhi-base-camp-trek/", "Rakaposhi base camp trek"],
    ["/expeditions/spantik-peak-expedition/", "Spantik expedition"],
    ["/destinations/hunza/", "Hunza valley guide"],
  ],
  "src/content/trekking/nangma-valley-trek.md": [
    ["/trekking/thalle-la-trek/", "Thalle La trek"],
    ["/destinations/khaplu/", "Khaplu travel guide"],
    ["/expeditions/laila-peak-expedition/", "Laila Peak expedition"],
  ],
  "src/content/trekking/majrooh-top-trek.md": [
    ["/trekking/thalle-la-trek/", "Thalle La trek"],
    ["/destinations/skardu/", "Skardu travel guide"],
    ["/blog/best-time-to-visit-skardu/", "Best time to visit Skardu"],
  ],
  "src/content/trekking/thalle-la-trek.md": [
    ["/destinations/khaplu/", "Khaplu travel guide"],
    ["/destinations/shigar/", "Shigar valley guide"],
    ["/trekking/nangma-valley-trek/", "Nangma Valley trek"],
  ],
  "src/content/expeditions/k2-expediiton.md": [
    ["/trekking/k2-base-camp-trek/", "K2 base camp trek"],
    ["/expeditions/broad-peak-expedition/", "Broad Peak expedition"],
    ["/expeditions/gasherbrum-ii-expedition/", "Gasherbrum II expedition"],
  ],
  "src/content/expeditions/broad-peak-expedition.md": [
    ["/expeditions/k2-expedition/", "K2 expedition"],
    ["/expeditions/gasherbrum-ii-expedition/", "Gasherbrum II expedition"],
    ["/trekking/k2-base-camp-trek/", "K2 base camp trek"],
  ],
  "src/content/expeditions/gasherbrum-ii-expedition.md": [
    ["/expeditions/gasherbrum-i-expedition/", "Gasherbrum I expedition"],
    ["/expeditions/broad-peak-expedition/", "Broad Peak expedition"],
    ["/trekking/k2-base-camp-trek/", "K2 base camp trek"],
  ],
  "src/content/expeditions/ghasherbrum-1.md": [
    ["/expeditions/gasherbrum-ii-expedition/", "Gasherbrum II expedition"],
    ["/expeditions/k2-expedition/", "K2 expedition"],
    ["/trekking/gondogoro-la-circuit-trek/", "Gondogoro La circuit trek"],
  ],
  "src/content/expeditions/nanga-parbat-expedition.md": [
    ["/trekking/fairy-meadows-base-camp-trek/", "Fairy Meadows base camp trek"],
    ["/destinations/fairy-meadows/", "Fairy Meadows travel guide"],
    ["/expeditions/k2-expedition/", "K2 expedition"],
  ],
  "src/content/expeditions/laila-peak-expedition.md": [
    ["/trekking/nangma-valley-trek/", "Nangma Valley trek"],
    ["/destinations/khaplu/", "Khaplu travel guide"],
    ["/expeditions/trango-expedition/", "Trango Tower expedition"],
  ],
  "src/content/expeditions/spantik-peak-expedition.md": [
    ["/trekking/rush-lake-trek/", "Rush Lake trek"],
    ["/expeditions/broad-peak-expedition/", "Broad Peak expedition"],
    ["/destinations/hunza/", "Hunza valley guide"],
  ],
  "src/content/expeditions/trango-expedition.md": [
    ["/trekking/k2-base-camp-trek/", "K2 base camp trek"],
    ["/expeditions/laila-peak-expedition/", "Laila Peak expedition"],
    ["/destinations/shigar/", "Shigar valley guide"],
  ],
  "src/content/tours/hunza-valley-heritage-tour.md": [
    ["/destinations/hunza/", "Hunza valley guide"],
    ["/tours/autumn-hunza-skardu-tour/", "Autumn tour of Hunza and Skardu"],
    ["/trekking/rakaposhi-base-camp-trek/", "Rakaposhi base camp trek"],
  ],
  "src/content/tours/autumn-hunza-skardu-tour.md": [
    ["/blog/best-time-to-visit-skardu/", "Best time to visit Skardu"],
    ["/tours/hunza-valley-heritage-tour/", "Hunza valley tour"],
    ["/destinations/skardu/", "Skardu travel guide"],
  ],
  "src/content/tours/spring-bloosom-tour.md": [
    ["/destinations/hunza/", "Hunza valley guide"],
    ["/tours/hunza-valley-heritage-tour/", "Hunza valley tour"],
    ["/blog/best-time-to-visit-skardu/", "Best time to visit Skardu"],
  ],
  "src/content/tours/gilgit-baltistan-grand-circuit.md": [
    ["/destinations/hunza/", "Hunza valley guide"],
    ["/destinations/skardu/", "Skardu travel guide"],
    ["/tours/deosai-khaplu-tour/", "Deosai and Khaplu tour"],
  ],
  "src/content/tours/deosai-khaplu-tour.md": [
    ["/jeep-safaris/deosai-jeep-safari/", "Deosai jeep safari"],
    ["/destinations/deosai/", "Deosai National Park guide"],
    ["/destinations/khaplu/", "Khaplu travel guide"],
  ],
  "src/content/tours/fairy-meadows-nanga-parbat-tour.md": [
    ["/destinations/fairy-meadows/", "Fairy Meadows travel guide"],
    ["/trekking/fairy-meadows-base-camp-trek/", "Fairy Meadows base camp trek"],
    ["/expeditions/nanga-parbat-expedition/", "Nanga Parbat expedition"],
  ],
  "src/content/tours/skardu-shigar-valley-explorer.md": [
    ["/destinations/skardu/", "Skardu travel guide"],
    ["/destinations/shigar/", "Shigar valley guide"],
    ["/jeep-safaris/shigar-basho-khaplu-jeep-safari/", "Shigar and Khaplu jeep safari"],
  ],
  "src/content/jeep-safaris/deosai-jeep-safari.md": [
    ["/destinations/deosai/", "Deosai National Park guide"],
    ["/tours/deosai-khaplu-tour/", "Deosai and Khaplu tour"],
    ["/destinations/skardu/", "Skardu travel guide"],
  ],
  "src/content/jeep-safaris/shigar-basho-khaplu-jeep-adventure.md": [
    ["/destinations/shigar/", "Shigar valley guide"],
    ["/destinations/khaplu/", "Khaplu travel guide"],
    ["/tours/skardu-shigar-valley-explorer/", "Skardu and Shigar valley tour"],
  ],
  "src/content/jeep-safaris/untitled.md": [
    ["/tours/gilgit-baltistan-grand-circuit/", "Gilgit-Baltistan grand circuit"],
    ["/destinations/hunza/", "Hunza valley guide"],
    ["/vehicles/toyota-prado-4x4/", "Prado 4x4 hire"],
  ],
  "src/content/vehicles/toyota-prado-4x4.md": [
    ["/vehicles/toyota-hiace-van/", "Hiace van hire"],
    ["/jeep-safaris/deosai-jeep-safari/", "Deosai jeep safari"],
    ["/destinations/skardu/", "Skardu travel guide"],
  ],
  "src/content/vehicles/toyota-hiace-van.md": [
    ["/vehicles/toyota-prado-4x4/", "Prado 4x4 hire"],
    ["/vehicles/coaster-group-transport/", "Coaster hire for groups"],
    ["/tours/gilgit-baltistan-grand-circuit/", "Gilgit-Baltistan grand circuit"],
  ],
  "src/content/vehicles/coaster-group-transport.md": [
    ["/vehicles/toyota-hiace-van/", "Hiace van hire"],
    ["/vehicles/toyota-prado-4x4/", "Prado 4x4 hire"],
    ["/plan-a-trip/", "Plan a group trip"],
  ],
  "src/content/hunting-services/permit-mountain-expedition-logistics.md": [
    ["/destinations/khaplu/", "Khaplu travel guide"],
    ["/plan-a-trip/", "Plan a trip"],
    ["/faqs/", "Travel FAQs"],
  ],
  "src/content/pages/destination-skardu.md": [
    ["/tours/skardu-shigar-valley-explorer/", "Skardu and Shigar valley tour"],
    ["/jeep-safaris/deosai-jeep-safari/", "Deosai jeep safari"],
    ["/blog/best-time-to-visit-skardu/", "Best time to visit Skardu"],
  ],
  "src/content/pages/destination-hunza.md": [
    ["/tours/hunza-valley-heritage-tour/", "Hunza valley tour"],
    ["/tours/spring-blossom-tour/", "Spring blossom tour"],
    ["/trekking/rakaposhi-base-camp-trek/", "Rakaposhi base camp trek"],
  ],
  "src/content/pages/destination-deosai.md": [
    ["/jeep-safaris/deosai-jeep-safari/", "Deosai jeep safari"],
    ["/tours/deosai-khaplu-tour/", "Deosai and Khaplu tour"],
    ["/blog/best-time-to-visit-skardu/", "Best time to visit Skardu"],
  ],
  "src/content/pages/destination-fairy-meadows.md": [
    ["/tours/fairy-meadows-nanga-parbat-tour/", "Fairy Meadows tour"],
    ["/trekking/fairy-meadows-base-camp-trek/", "Fairy Meadows base camp trek"],
    ["/expeditions/nanga-parbat-expedition/", "Nanga Parbat expedition"],
  ],
  "src/content/pages/destination-khaplu.md": [
    ["/tours/deosai-khaplu-tour/", "Deosai and Khaplu tour"],
    ["/jeep-safaris/shigar-basho-khaplu-jeep-safari/", "Shigar and Khaplu jeep safari"],
    ["/trekking/thalle-la-trek/", "Thalle La trek"],
  ],
  "src/content/pages/destination-shigar.md": [
    ["/tours/skardu-shigar-valley-explorer/", "Skardu and Shigar valley tour"],
    ["/trekking/k2-base-camp-trek/", "K2 base camp trek"],
    ["/jeep-safaris/shigar-basho-khaplu-jeep-safari/", "Shigar and Khaplu jeep safari"],
  ],
};

const MARK_OPEN = '<!-- related-journeys -->';
const MARK_CLOSE = '<!-- /related-journeys -->';

const q = (s) => JSON.stringify(String(s));
const indentOf = (l) => (l.match(/^[ \t]*/) || [''])[0].length;
const isBlank = (l) => l.trim() === '';

function setTopKey(lines, fmEnd, key, value) {
  const line = `${key}: ${q(value)}`;
  let keyAt = -1;
  for (let i = 1; i < fmEnd; i++) if (new RegExp(`^${key}:`).test(lines[i])) { keyAt = i; break; }
  if (keyAt === -1) {
    let at = fmEnd;
    for (let i = 1; i < fmEnd; i++) if (/^seo:/.test(lines[i])) { at = i; break; }
    lines.splice(at, 0, line);
    return 1;
  }
  let last = keyAt;
  for (let i = keyAt + 1; i < fmEnd; i++) {
    if (isBlank(lines[i]) || indentOf(lines[i]) > 0) { last = i; continue; }
    break;
  }
  lines.splice(keyAt, last - keyAt + 1, line);
  return 1 - (last - keyAt + 1);
}

let altDone = 0, linksDone = 0, problems = 0;
const files = new Set([...Object.keys(ALT), ...Object.keys(RELATED)]);

for (const file of files) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  if (lines[0].replace(/^﻿/, '') !== '---') { console.log(`front matter nahi mila  ${file}`); problems++; continue; }
  let fmEnd = 1;
  while (fmEnd < lines.length && lines[fmEnd] !== '---') fmEnd++;
  if (fmEnd >= lines.length) { console.log(`front matter band nahi hua  ${file}`); problems++; continue; }

  const notes = [];
  if (ALT[file]) { fmEnd += setTopKey(lines, fmEnd, 'cover_image_alt', ALT[file]); altDone++; notes.push('alt'); }

  let body = lines.slice(fmEnd + 1).join(nl);
  if (RELATED[file]) {
    const items = RELATED[file].map(([url, label]) => `<li><a href="${url}">${label}</a></li>`).join('');
    const block = `${MARK_OPEN}${nl}<h2><strong>Related journeys</strong></h2>${nl}<ul>${items}</ul>${nl}${MARK_CLOSE}`;
    const existing = new RegExp(`${MARK_OPEN}[\\s\\S]*?${MARK_CLOSE}`);
    body = existing.test(body)
      ? body.replace(existing, () => block)
      : body.replace(/\s*$/, '') + nl + nl + block + nl;
    linksDone++; notes.push(`${RELATED[file].length} links`);
  }

  const out = lines.slice(0, fmEnd + 1).join(nl) + nl + body;
  if (out === text) continue;
  console.log(`${file}  (${notes.join(', ')})`);
  if (WRITE) fs.writeFileSync(file, out, 'utf8');
}

console.log(`\n${altDone} alt texts, ${linksDone} pages par related links ${WRITE ? 'lag gaye' : 'lagenge'}, ${problems} problem.`);
if (!WRITE) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
