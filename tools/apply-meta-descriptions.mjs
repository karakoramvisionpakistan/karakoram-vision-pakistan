// Har page ki meta description set karta hai (Google ke liye, click ke liye likhi hui).
//   node tools/apply-meta-descriptions.mjs           -> sirf dikhata hai
//   node tools/apply-meta-descriptions.mjs --write   -> files badal deta hai
// Sirf `seo:` block ki `description` badalti hai. Baqi front matter aur page ka
// content bilkul nahi chhedta.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

const DESCRIPTIONS = {
  "src/content/trekking/k2-base-camp-baltoro-trek.md":
    "Trek the Baltoro Glacier to Concordia and K2 base camp in 21 days. Permits, porters, cook and guide arranged by our Skardu team. Ask for dates and costs.",
  "src/content/trekking/gondogoro-la-circuit-trek.md":
    "Cross Gondogoro La on a 21-day Baltoro circuit from Concordia down to Hushe. Fixed ropes, climbing guides and permits handled. Ask for this season's dates.",
  "src/content/trekking/biafo-hisper-trek.md":
    "Biafo Hispar Pass trek, 22 days across the longest glacier system outside the poles, with Skardu logistics, permits and guides from Karakoram Vision.",
  "src/content/trekking/fairy-meadows-nanga-parbat-base-camp-trek.md":
    "Ten days from Raikot Bridge to Fairy Meadows, Beyal camp and the Nanga Parbat base camp viewpoint. Small groups and local guides. Ask for the day plan.",
  "src/content/trekking/rakaposhi-base-camp-trek.md":
    "Seven days from Minapin up to Rakaposhi base camp, with glacier views over Nagar valley. A good first Karakoram trek. Ask for dates, costs and the plan.",
  "src/content/trekking/rush-lake-trek.md":
    "Fourteen days to Rush Lake, one of the world's highest alpine lakes, high above Nagar valley. Guides, porters and camps included. Ask for dates and costs.",
  "src/content/trekking/nangma-valley-trek.md":
    "Nangma Valley trek from Kanday, 10 easy days in the big-wall valley known as the Yosemite of Pakistan. Guided and supported from Skardu, all seasons.",
  "src/content/trekking/majrooh-top-trek.md":
    "Majrooh Top trek, 10 easy days to 4,850m with wide Karakoram views. A short, non-technical route first explored by our own team, guided from Skardu.",
  "src/content/trekking/thalle-la-trek.md":
    "Nine days over the Thalle La pass from Shigar to Khaplu, through summer pastures and Balti villages. Easy pace, full support. Ask for dates and prices.",
  "src/content/expeditions/k2-expediiton.md":
    "K2 expedition, 60 days from Islamabad with permits, Baltoro approach, base camp services, high-altitude porters and oxygen support from Karakoram Vision.",
  "src/content/expeditions/broad-peak-expedition.md":
    "Broad Peak 8,051m expedition, 50 days from Islamabad with permits, Baltoro approach, stocked base camp and high-altitude support. Ask for the full plan.",
  "src/content/expeditions/gasherbrum-ii-expedition.md":
    "Gasherbrum II 8,035m expedition, 50 days with permit handling, Baltoro approach, base camp and climbing support. Ask for dates, costs and what's included.",
  "src/content/expeditions/ghasherbrum-1.md":
    "Gasherbrum I, Hidden Peak, 8,080m: a 50-day expedition with permits, Baltoro approach, base camp and high-altitude support. Ask for the full cost sheet.",
  "src/content/expeditions/nanga-parbat-expedition.md":
    "Nanga Parbat 8,126m expedition, 42 days with permits, base camp, cooks, porters and high-altitude support from a Pakistani operator. Ask for route options.",
  "src/content/expeditions/laila-peak-expedition.md":
    "Laila Peak expedition, 30 days in the Hushe valley for climbers after one of the steepest, most photographed lines in Pakistan. Ask for dates and costs.",
  "src/content/expeditions/spantik-peak-expedition.md":
    "Spantik, the Golden Peak, 7,027m in 35 days - a realistic first 7,000er with full base camp support. Ask for dates, costs and the acclimatisation plan.",
  "src/content/expeditions/trango-expedition.md":
    "Trango Tower expedition, 33 days of big-wall climbing on the great granite walls of Baltoro, with permits, porters and base-camp support from Skardu.",
  "src/content/tours/hunza-valley-heritage-tour.md":
    "Ten days through Gilgit, Nagar and Hunza: Baltit and Altit forts, village walks and Karakoram Highway viewpoints. Private dates. Ask for the day-by-day plan.",
  "src/content/tours/autumn-hunza-skardu-tour.md":
    "Fourteen days of autumn colour through Hunza, Skardu and Khaplu - orchards, forts and mountain viewpoints at their best. Ask for October dates and costs.",
  "src/content/tours/spring-bloosom-tour.md":
    "Spring blossom tour of Hunza and Gilgit-Baltistan, 16 easy days through apricot and cherry bloom, with hotels, 4x4 transport and a local guide.",
  "src/content/tours/gilgit-baltistan-grand-circuit.md":
    "A 14-day private circuit of Gilgit, Hunza, Skardu, Shigar and Khaplu along the Karakoram Highway. Hotels, 4x4 and guide included. Ask for dates and costs.",
  "src/content/tours/deosai-khaplu-tour.md":
    "Eight days linking Skardu, the Deosai plateau, Shigar and Khaplu palace - lakes, wildlife and Balti heritage in one trip. Ask for dates and prices.",
  "src/content/tours/fairy-meadows-nanga-parbat-tour.md":
    "Eight days to Fairy Meadows and the Raikot face of Nanga Parbat, with jeep transfer and an easy walk to the viewpoint. Ask for dates, hotels and costs.",
  "src/content/tours/skardu-shigar-valley-explorer.md":
    "Seven days around Skardu - Shangrila and Kachura lakes, Shigar fort, the Sarfaranga cold desert, and free days to add more. Ask for dates and prices.",
  "src/content/jeep-safaris/deosai-jeep-safari.md":
    "Five days by 4x4 from Skardu across the Deosai plateau, the Land of Giants, with lake stops and a chance of brown bear. Ask for open-season dates.",
  "src/content/jeep-safaris/shigar-basho-khaplu-jeep-adventure.md":
    "Six days by jeep through Shigar, the Basho meadows and the Shyok valley to Khaplu palace. Private vehicle and driver. Ask for dates, hotels and costs.",
  "src/content/jeep-safaris/untitled.md":
    "A 22-day road trip from Islamabad through Gilgit-Baltistan, Chitral and Swat - high passes, villages and valleys at an easy pace. Ask for the route plan.",
  "src/content/vehicles/toyota-prado-4x4.md":
    "Hire a Toyota Prado 4x4 with an experienced mountain driver for Skardu, Deosai, Hunza and Khaplu roads. Daily or full-trip rates. Ask for a quote.",
  "src/content/vehicles/toyota-hiace-van.md":
    "Hire a Toyota Hiace van with driver for family and group travel on the Karakoram Highway, with room for luggage and trekking gear. Ask for a quote.",
  "src/content/vehicles/coaster-group-transport.md":
    "Hire a Coaster bus with driver for larger groups on tours, airport transfers and long mountain road journeys in Pakistan. Ask for route and rate.",
  "src/content/hunting-services/permit-mountain-expedition-logistics.md":
    "Ibex and markhor hunting in Gilgit-Baltistan: permit paperwork, trophy-area access, guides, camps and transport under official community quotas.",
  "src/content/blog/best-time-to-visit-skardu.md":
    "Month by month: when Skardu's roads and lakes open, when Deosai is reachable, when autumn colour peaks, and the weeks most travellers should avoid.",
  "src/content/blog/northern-pakistan-packing-checklist.md":
    "What to actually pack for northern Pakistan - layers, footwear, documents, and the gear you can hire in Skardu instead of carrying it from home.",
  "src/content/blog/prepare-for-k2-base-camp-trek.md":
    "How to train, what to carry, which insurance works and how to acclimatise for the K2 base camp trek - advice from the team that runs the route.",
  "src/content/blog/responsible-travel-gilgit-baltistan.md":
    "Small things that make a real difference in Gilgit-Baltistan: waste, water, photography, dress, and spending that actually reaches local families.",
  "src/content/pages/about-us.md":
    "Karakoram Vision Pakistan is a Skardu-based company run by local guides, planning tours, treks and expeditions across Gilgit-Baltistan. Meet the team.",
  "src/content/pages/why-choose-us.md":
    "A local Skardu team, private dates, and direct answers from the people who actually run your trip - no middlemen between you and the mountain.",
  "src/content/pages/faqs.md":
    "Visas, permits, safety, altitude, costs, best season and how booking works - straight answers to the questions travellers ask us most about Pakistan.",
  "src/content/pages/equipment-check-list.md":
    "Trekking and mountaineering equipment checklist for northern Pakistan: clothing, footwear, sleeping gear and climbing kit, by altitude and season.",
  "src/content/pages/family-trip.md":
    "Private family tours of northern Pakistan, planned around your own pace and dates, with comfortable hotels, safe transport and an experienced local guide.",
  "src/content/pages/destination-skardu.md":
    "Skardu travel guide: when to go, what to see around the lakes and valleys, and which treks and tours start here. Plan the trip with a local team.",
  "src/content/pages/destination-hunza.md":
    "Hunza travel guide: forts, villages and viewpoints, the best months for blossom and autumn colour, and how many days to stay. Plan it with locals.",
  "src/content/pages/destination-deosai.md":
    "Deosai National Park guide: when the plateau opens, how to reach it from Skardu, the wildlife to look for, and the trips that include it.",
  "src/content/pages/destination-fairy-meadows.md":
    "Fairy Meadows guide: the jeep road from the Karakoram Highway, the walk up, where to stay, and when Nanga Parbat shows itself most clearly.",
  "src/content/pages/destination-khaplu.md":
    "Khaplu travel guide: the restored palace, Shyok valley drives, the Hushe road toward the big peaks, and the best months to visit Baltistan.",
  "src/content/pages/destination-shigar.md":
    "Shigar valley guide: the fort-palace, the cold desert, and the Braldu road to Askole where every Baltoro trek and K2 expedition begins.",
  "src/content/pages/privacy-policy.md":
    "How Karakoram Vision Pakistan collects, uses and protects the details you send through our enquiry forms, email and this website.",
  "src/content/pages/refund-policy.md":
    "Cancellation and refund terms for tours, treks and expeditions, including deposits, and how they are confirmed in your written proposal.",
  "src/content/pages/terms-and-conditions.md":
    "Booking and website terms for Karakoram Vision Pakistan: what we provide, what is expected of travellers, and how changes are handled.",
  "src/index.njk":
    "Skardu-based tour operator for Pakistan: Hunza and Gilgit-Baltistan tours, Karakoram treks, 8,000m expeditions and jeep safaris. Plan your trip with us.",
  "src/tours/index.njk":
    "Pakistan tour packages from 7 to 16 days - Hunza, Skardu, Deosai and Khaplu, with hotels, transport and a local guide. Compare trips and ask for dates.",
  "src/trekking/index.njk":
    "Karakoram treks from 7 to 22 days, from Rakaposhi base camp to K2 and Gondogoro La. Permits, porters and guides arranged. Compare routes and seasons.",
  "src/expeditions/index.njk":
    "Expeditions in Pakistan - K2, Broad Peak, Gasherbrum, Nanga Parbat, Spantik and Trango. Permits, base camp and high-altitude support arranged from Skardu.",
  "src/jeep-safaris/index.njk":
    "Private 4x4 journeys through Deosai, Shigar, Basho and Khaplu, from 5 to 22 days, with driver and hotels. Compare routes and ask for open-season dates.",
  "src/vehicles/index.njk":
    "Hire a Prado, Hiace or Coaster with an experienced mountain driver for Skardu, Hunza and Karakoram Highway travel. Ask for daily or per-trip rates.",
  "src/destinations/index.njk":
    "Where to go in northern Pakistan - Skardu, Hunza, Deosai, Fairy Meadows, Shigar and Khaplu, with the best season for each. Start planning your route.",
  "src/blog/index.njk":
    "Travel guides for northern Pakistan: best seasons, packing, permits and trek preparation, written by a Skardu-based team that runs these routes.",
  "src/plan-a-trip/index.njk":
    "Tell us your dates, group size and interests, and get a private itinerary with costs for a tour, trek or expedition. You decide after you see the plan.",
  "src/contact-us/index.njk":
    "Call, WhatsApp or email our Skardu office about tours, treks and expeditions in Pakistan. Open 9am to 9pm Pakistan time, seven days a week.",
  "src/guest-reviews/index.njk":
    "Read what travellers say after their trips with Karakoram Vision Pakistan - and leave your own review if you have travelled with our team.",
  "src/international-travelers/index.njk":
    "Planning Pakistan from abroad: visa and permit basics, flights to Skardu, what a trip really costs, and the support you get on the ground.",
  "src/travel-resources/index.njk":
    "Permits, packing, insurance, altitude and gear - the practical pages worth reading before a trek or expedition in Pakistan.",
  "src/hunting-services/index.njk":
    "Permit paperwork, trophy-area access, guides and camps for officially authorised ibex and markhor programmes in Gilgit-Baltistan. Ask about quotas.",
  "src/special-interests/index.njk":
    "Cycling, motorcycling, photography, festivals, winter travel and eco tourism in northern Pakistan - trips built around one interest. Ask for ideas.",
  "src/holiday-types/index.njk":
    "Cultural tours, family holidays, road trips, luxury travel and weekend escapes in northern Pakistan. Find the kind of trip that suits you.",
  "src/trip-calendar/index.njk":
    "See which tours, treks and expeditions have fixed dates this season, and which can be arranged privately on dates that suit you.",
  "src/news/index.njk":
    "Expedition news, new routes, and road and season updates from Gilgit-Baltistan, posted by the Karakoram Vision team in Skardu.",
  "src/social-responsibility/index.njk":
    "How we work with porters, local staff and mountain communities, and what we do about waste on trekking and expedition routes.",
  "src/search/index.njk":
    "Search tours, treks, expeditions, jeep safaris, vehicles and travel guides across the Karakoram Vision Pakistan website.",
  "src/journey-categories/index.njk":
    "Every kind of journey we run, in one place - tours, treks, expeditions, jeep safaris, vehicle hire and special-interest travel in Pakistan.",
  "src/expeditions/fixed-departures/index.njk":
    "Expeditions with published dates this season - join an existing team for K2, Broad Peak, Gasherbrum or Spantik. See what is still open.",
  "src/expeditions/8000m-peaks/index.njk":
    "Pakistan's 8,000m peaks - K2, Nanga Parbat, Gasherbrum I and II, Broad Peak - with permits, base camp and high-altitude support from Skardu.",
  "src/trekking/fixed-departures/index.njk":
    "Treks with set dates you can join as an individual or a small group, from Baltoro to Nagar valley. See this season's departures.",
  "src/trekking/k2-treks/index.njk":
    "Routes to K2 base camp - the classic Baltoro trek and the Gondogoro La circuit - with permits, porters and guides arranged from Skardu.",
  "src/trekking/best-sellers/index.njk":
    "The treks travellers ask for most: K2 base camp, Fairy Meadows, Rakaposhi and Nangma valley. Compare days, difficulty and the right season.",
  "src/tours/fixed-departures/index.njk":
    "Group tours with published dates - join other travellers instead of booking privately, and share the cost of transport and guide.",
  "src/tours/cultural-tours/index.njk":
    "Forts, festivals, Balti and Burusho villages, and the people of the Karakoram - tours built around culture rather than distance covered.",
};

const indentOf = (line) => (line.match(/^[ \t]*/) || [''])[0].length;
const isBlank = (line) => line.trim() === '';

function setDescription(text, desc) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);

  const seoAt = lines.findIndex((l) => /^seo:\s*$/.test(l));
  if (seoAt === -1) return { error: 'seo block nahi mila' };

  // seo block kahan khatam hota hai
  let end = seoAt + 1;
  while (end < lines.length && (isBlank(lines[end]) || indentOf(lines[end]) > 0)) end++;

  let keyAt = -1;
  for (let i = seoAt + 1; i < end; i++) {
    if (/^[ \t]+description:/.test(lines[i])) { keyAt = i; break; }
  }

  if (keyAt === -1) {
    // description hai hi nahi -> title ke baad daal dete hain
    let at = seoAt + 1;
    for (let i = seoAt + 1; i < end; i++) if (/^[ \t]+title:/.test(lines[i])) { at = i + 1; break; }
    const ind = ' '.repeat(indentOf(lines[seoAt + 1]) || 2);
    lines.splice(at, 0, `${ind}description: >-`, `${ind}  ${desc}`);
    return { text: lines.join(nl), action: 'added' };
  }

  const ind = ' '.repeat(indentOf(lines[keyAt]));
  // multi-line value ki saari lines (jo aur andar hain) bhi hata dete hain
  let last = keyAt;
  for (let i = keyAt + 1; i < end; i++) {
    if (isBlank(lines[i]) || indentOf(lines[i]) > ind.length) { last = i; continue; }
    break;
  }
  lines.splice(keyAt, last - keyAt + 1, `${ind}description: >-`, `${ind}  ${desc}`);
  return { text: lines.join(nl), action: 'replaced' };
}

let changed = 0, problems = 0;
for (const [file, desc] of Object.entries(DESCRIPTIONS)) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  const out = setDescription(text, desc);
  if (out.error) { console.log(`${out.error}  ${file}`); problems++; continue; }
  if (out.text === text) continue;
  console.log(`${file}  (${desc.length} chars, ${out.action})\n   + ${desc}`);
  changed++;
  if (WRITE) fs.writeFileSync(file, out.text, 'utf8');
}
console.log(`\n${changed} description ${WRITE ? 'theek ki' : 'theek hongi'}, ${problems} problem.`);
if (!WRITE) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
