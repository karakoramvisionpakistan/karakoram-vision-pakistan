// Un pages par "What's included / not included" ka draft daalta hai jahan khali hai.
//   node tools/apply-inclusions.mjs           -> sirf dikhata hai
//   node tools/apply-inclusions.mjs --write   -> files badal deta hai
//
// YEH DRAFT HAI. Client in ko dekh kar confirm ya adjust kare - khaas tor par
// vehicles ka fuel/driver allowance, aur expeditions ka oxygen/high-altitude support.
// Zabaan client ki apni K2 Expedition aur Broad Peak wali list se li gayi hai.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

const DATA = {
// ---------------- EXPEDITIONS ----------------
"src/content/expeditions/nanga-parbat-expedition.md": {
  included: [
    "Climbing permit, park fees and liaison officer expenses",
    "Invitation letter for the Pakistan mountaineering visa",
    "Airport pick and drop, and all ground transport in the itinerary",
    "Hotel bed and breakfast in Islamabad and on the approach",
    "Porters and transport to base camp",
    "Base camp services: kitchen tent, dining tent with tables and chairs, cook and kitchen staff",
    "All meals during the approach and at base camp",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance and emergency evacuation cover, including the helicopter rescue deposit",
    "Oxygen, personal climbing equipment and technical gear",
    "High-altitude porters and services above base camp",
    "Tips for porters, drivers and staff",
    "Any service not listed in the final written proposal",
  ],
},
"src/content/expeditions/trango-expedition.md": {
  included: [
    "Climbing permit, Central Karakoram National Park fees and liaison officer expenses",
    "Invitation letter for the Pakistan mountaineering visa",
    "Airport pick and drop, and road transport Islamabad - Skardu - Askole",
    "Hotel bed and breakfast in Islamabad and Skardu",
    "Porters for the Baltoro approach and return",
    "Base camp with kitchen tent, dining tent, cook and kitchen staff",
    "All meals during the trek and at base camp",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance and emergency evacuation cover, including the helicopter rescue deposit",
    "All personal and technical climbing equipment, including wall gear and ropes",
    "Any service above base camp",
    "Tips for porters, drivers and staff",
    "Any service not listed in the final written proposal",
  ],
},
"src/content/expeditions/ghasherbrum-1.md": {
  included: [
    "Climbing permit, Central Karakoram National Park fees and liaison officer expenses",
    "Invitation letter for the Pakistan mountaineering visa",
    "Airport pick and drop, and road transport Islamabad - Skardu - Askole",
    "Hotel bed and breakfast in Islamabad and Skardu",
    "Porters for the Baltoro approach to base camp",
    "Base camp services: kitchen tent, dining tent with tables and chairs, shower tent, cook and kitchen staff",
    "All meals during the trek and at base camp",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance and emergency evacuation cover, including the helicopter rescue deposit",
    "Oxygen, EPI gas and all personal climbing equipment",
    "High-altitude porters and services above base camp",
    "Tips for porters, drivers and staff",
    "Any service not listed in the final written proposal",
  ],
},

// ---------------- TREKKING ----------------
"src/content/trekking/biafo-hisper-trek.md": {
  included: [
    "Trekking permit, park fees and trekker registration",
    "Road transport Islamabad - Skardu - Askole, and Hispar - Karimabad - Islamabad",
    "Hotel bed and breakfast in Islamabad, Skardu and Karimabad",
    "Porters for the full traverse, with load limits as agreed",
    "Tents, sleeping mats and all camp equipment",
    "Cook, kitchen staff and all meals on trek",
    "Experienced trekking guide and glacier equipment for the roped sections",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance and emergency evacuation cover",
    "Personal trekking equipment, sleeping bag and clothing",
    "Tips for porters, guides and drivers",
    "Any service not listed in the final written proposal",
  ],
},
"src/content/trekking/majrooh-top-trek.md": {
  included: [
    "Trekking permit and trekker registration where applicable",
    "Jeep and road transport from Skardu to the trailhead and back",
    "Hotel bed and breakfast in Skardu",
    "Porters for group and personal loads, with limits as agreed",
    "Tents, sleeping mats and all camp equipment",
    "Cook, kitchen staff and all meals on trek",
    "Experienced local trekking guide",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance and emergency evacuation cover",
    "Personal trekking equipment, sleeping bag and clothing",
    "Tips for porters, guides and drivers",
    "Any service not listed in the final written proposal",
  ],
},
"src/content/trekking/nangma-valley-trek.md": {
  included: [
    "Trekking permit and trekker registration where applicable",
    "Jeep transport Skardu - Kanday and return, through the Shyok and Hushe valleys",
    "Hotel bed and breakfast in Skardu",
    "Porters from Kanday village, with load limits as agreed",
    "Tents, sleeping mats and all camp equipment",
    "Cook, kitchen staff and all meals on trek",
    "Experienced local trekking guide",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance and emergency evacuation cover",
    "Personal trekking and climbing equipment",
    "Tips for porters, guides and drivers",
    "Any service not listed in the final written proposal",
  ],
},

// ---------------- TOURS ----------------
"src/content/tours/spring-bloosom-tour.md": {
  included: [
    "Private vehicle with an experienced mountain driver for the whole itinerary",
    "Airport pick and drop in Islamabad",
    "Hotel accommodation on a bed and breakfast basis",
    "Local guide throughout the journey",
    "Entry fees for the forts and sites listed in the itinerary",
    "All road tolls, fuel and driver allowance",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance",
    "Lunch and dinner unless stated in the itinerary",
    "Personal expenses, shopping and optional activities",
    "Tips for the guide and driver",
    "Any service not listed in the final written proposal",
  ],
},

// ---------------- JEEP SAFARI ----------------
"src/content/jeep-safaris/untitled.md": {
  included: [
    "Vehicles and experienced drivers for every section of the route",
    "Airport pick and drop in Islamabad",
    "Hotel and guest house accommodation on a bed and breakfast basis",
    "Local guide throughout the journey",
    "Road permits and registration required for the districts on the route",
    "All road tolls, fuel and driver allowance",
  ],
  excluded: [
    "International flights and Pakistan visa fee",
    "Travel insurance",
    "Lunch and dinner unless stated in the itinerary",
    "Personal expenses and optional activities",
    "Tips for the guide and drivers",
    "Any service not listed in the final written proposal",
  ],
},

// ---------------- VEHICLES ----------------
"src/content/vehicles/toyota-prado-4x4.md": {
  included: [
    "Toyota Prado 4x4 in good mechanical condition",
    "Experienced mountain driver familiar with the route",
    "Fuel for the agreed itinerary",
    "Driver allowance, meals and accommodation",
    "Road tolls and vehicle entry fees",
  ],
  excluded: [
    "Accommodation and meals for passengers",
    "Entry tickets, permits and park fees for passengers",
    "Extra mileage beyond the agreed itinerary",
    "Tips for the driver",
    "Any service not listed in the written quote",
  ],
},
"src/content/vehicles/toyota-hiace-van.md": {
  included: [
    "Toyota Hiace van in good mechanical condition, with luggage space",
    "Experienced driver familiar with the Karakoram Highway",
    "Fuel for the agreed itinerary",
    "Driver allowance, meals and accommodation",
    "Road tolls and vehicle entry fees",
  ],
  excluded: [
    "Accommodation and meals for passengers",
    "Entry tickets, permits and park fees for passengers",
    "Extra mileage beyond the agreed itinerary",
    "Jeep transfers for rough sections, quoted separately",
    "Tips for the driver",
  ],
},
"src/content/vehicles/coaster-group-transport.md": {
  included: [
    "Coaster bus in good mechanical condition, with luggage space",
    "Experienced driver familiar with the main mountain highways",
    "Fuel for the agreed itinerary",
    "Driver allowance, meals and accommodation",
    "Road tolls and vehicle entry fees",
  ],
  excluded: [
    "Accommodation and meals for passengers",
    "Entry tickets, permits and park fees for passengers",
    "Extra mileage beyond the agreed itinerary",
    "Jeep transfers for narrow or rough sections, quoted separately",
    "Tips for the driver",
  ],
},
};

const q = (s) => JSON.stringify(String(s));
const indentOf = (l) => (l.match(/^[ \t]*/) || [''])[0].length;
const isBlank = (l) => l.trim() === '';

function setList(lines, fmEnd, key, items) {
  const block = [`${key}:`, ...items.map((i) => `  - ${q(i)}`)];
  let keyAt = -1;
  for (let i = 1; i < fmEnd; i++) if (new RegExp(`^${key}:`).test(lines[i])) { keyAt = i; break; }
  if (keyAt === -1) {
    let at = fmEnd;
    for (let i = 1; i < fmEnd; i++) if (/^seo:/.test(lines[i])) { at = i; break; }
    lines.splice(at, 0, ...block);
    return block.length;
  }
  let last = keyAt;
  for (let i = keyAt + 1; i < fmEnd; i++) {
    if (isBlank(lines[i]) || indentOf(lines[i]) > 0) { last = i; continue; }
    break;
  }
  lines.splice(keyAt, last - keyAt + 1, ...block);
  return block.length - (last - keyAt + 1);
}

let changed = 0, problems = 0;
for (const [file, data] of Object.entries(DATA)) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  if (lines[0].replace(/^﻿/, '') !== '---') { console.log(`front matter nahi mila  ${file}`); problems++; continue; }
  let fmEnd = 1;
  while (fmEnd < lines.length && lines[fmEnd] !== '---') fmEnd++;
  if (fmEnd >= lines.length) { console.log(`front matter band nahi hua  ${file}`); problems++; continue; }

  fmEnd += setList(lines, fmEnd, 'included', data.included);
  fmEnd += setList(lines, fmEnd, 'excluded', data.excluded);

  const out = lines.join(nl);
  if (out === text) continue;
  console.log(`${file}  (${data.included.length} included, ${data.excluded.length} excluded)`);
  changed++;
  if (WRITE) fs.writeFileSync(file, out, 'utf8');
}
console.log(`\n${changed} pages ${WRITE ? 'update ho gaye' : 'update honge'}, ${problems} problem.`);
console.log('YAAD RAHE: yeh draft hai - client se confirm karwa lein.');
if (!WRITE) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
