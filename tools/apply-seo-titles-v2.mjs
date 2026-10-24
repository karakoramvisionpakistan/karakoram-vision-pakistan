// v2 SEO titles: keyword pehle, 60 characters se kam, trips par days.
//   node tools/apply-seo-titles-v2.mjs           -> sirf dikhata hai, change nahi karta
//   node tools/apply-seo-titles-v2.mjs --write   -> files ko sach-much badal deta hai
// Sirf har page ki `seo: title:` line badalti hai, aur kuch nahi.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

const TITLES = {
  "src/index.njk": "Pakistan Tours, Treks & K2 Expeditions | Karakoram Vision",
  "src/content/trekking/k2-base-camp-baltoro-trek.md": "K2 Base Camp Trek, Pakistan - 21 Days | Karakoram Vision",
  "src/content/trekking/gondogoro-la-circuit-trek.md": "Gondogoro La Trek, Pakistan - 21 Days | Karakoram Vision",
  "src/content/trekking/biafo-hisper-trek.md": "Biafo Hispar Pass Trek - 22 Days | Karakoram Vision",
  "src/content/trekking/fairy-meadows-nanga-parbat-base-camp-trek.md": "Fairy Meadows Base Camp Trek - 10 Days | Karakoram Vision",
  "src/content/trekking/rakaposhi-base-camp-trek.md": "Rakaposhi Base Camp Trek - 7 Days | Karakoram Vision",
  "src/content/trekking/rush-lake-trek.md": "Rush Lake Trek, Nagar Valley - 14 Days | Karakoram Vision",
  "src/content/trekking/nangma-valley-trek.md": "Nangma Valley Trek, Kanday - 10 Days | Karakoram Vision",
  "src/content/trekking/majrooh-top-trek.md": "Majrooh Top Trek, Skardu - 10 Days | Karakoram Vision",
  "src/content/trekking/thalle-la-trek.md": "Thalle La Trek, Shigar to Khaplu - 9 Days | Karakoram Vision",
  "src/content/expeditions/k2-expediiton.md": "K2 Expedition, Pakistan - 60 Days | Karakoram Vision",
  "src/content/expeditions/broad-peak-expedition.md": "Broad Peak Expedition 8051m - 50 Days | Karakoram Vision",
  "src/content/expeditions/gasherbrum-ii-expedition.md": "Gasherbrum II Expedition - 50 Days | Karakoram Vision",
  "src/content/expeditions/ghasherbrum-1.md": "Gasherbrum I Expedition - 50 Days | Karakoram Vision",
  "src/content/expeditions/nanga-parbat-expedition.md": "Nanga Parbat Expedition - 42 Days | Karakoram Vision",
  "src/content/expeditions/laila-peak-expedition.md": "Laila Peak Expedition, Hushe - 30 Days | Karakoram Vision",
  "src/content/expeditions/spantik-peak-expedition.md": "Spantik Golden Peak Expedition - 35 Days | Karakoram Vision",
  "src/content/expeditions/trango-expedition.md": "Trango Tower Expedition - 33 Days | Karakoram Vision",
  "src/content/tours/hunza-valley-heritage-tour.md": "Hunza Valley Tour Package - 10 Days | Karakoram Vision",
  "src/content/tours/autumn-hunza-skardu-tour.md": "Autumn Tour: Hunza & Skardu - 14 Days | Karakoram Vision",
  "src/content/tours/spring-bloosom-tour.md": "Hunza Blossom Tour, Spring - 16 Days | Karakoram Vision",
  "src/content/tours/gilgit-baltistan-grand-circuit.md": "Gilgit-Baltistan Tour - 14 Days | Karakoram Vision",
  "src/content/tours/deosai-khaplu-tour.md": "Deosai & Khaplu Tour, Skardu - 8 Days | Karakoram Vision",
  "src/content/tours/fairy-meadows-nanga-parbat-tour.md": "Fairy Meadows Tour, Nanga Parbat - 8 Days | Karakoram Vision",
  "src/content/tours/skardu-shigar-valley-explorer.md": "Skardu & Shigar Valley Tour - 7 Days | Karakoram Vision",
  "src/content/jeep-safaris/deosai-jeep-safari.md": "Deosai Jeep Safari from Skardu - 5 Days | Karakoram Vision",
  "src/content/jeep-safaris/shigar-basho-khaplu-jeep-adventure.md": "Shigar & Khaplu Jeep Safari - 6 Days | Karakoram Vision",
  "src/content/jeep-safaris/untitled.md": "Mountains & Villages Safari - 22 Days | Karakoram Vision",
  "src/content/vehicles/toyota-prado-4x4.md": "Toyota Prado 4x4 Rental in Skardu | Karakoram Vision",
  "src/content/vehicles/toyota-hiace-van.md": "Toyota Hiace Van Rental in Skardu | Karakoram Vision",
  "src/content/vehicles/coaster-group-transport.md": "Coaster Rental for Groups, Skardu | Karakoram Vision",
  "src/content/hunting-services/permit-mountain-expedition-logistics.md": "Ibex & Markhor Hunting Permits, Pakistan | Karakoram Vision",
  "src/content/pages/destination-skardu.md": "Skardu Travel Guide: Best Time & Places | Karakoram Vision",
  "src/content/pages/destination-hunza.md": "Hunza Valley Guide: Best Time & Places | Karakoram Vision",
  "src/content/pages/destination-deosai.md": "Deosai National Park Guide & Trips | Karakoram Vision",
  "src/content/pages/destination-fairy-meadows.md": "Fairy Meadows Guide: How to Get There | Karakoram Vision",
  "src/content/pages/destination-khaplu.md": "Khaplu & Shyok Valley Travel Guide | Karakoram Vision",
  "src/content/pages/destination-shigar.md": "Shigar Valley Travel Guide, Skardu | Karakoram Vision",
  "src/content/blog/best-time-to-visit-skardu.md": "Best Time to Visit Skardu, Pakistan | Karakoram Vision",
  "src/content/blog/northern-pakistan-packing-checklist.md": "Northern Pakistan Packing List | Karakoram Vision",
  "src/content/blog/prepare-for-k2-base-camp-trek.md": "How to Prepare for K2 Base Camp Trek | Karakoram Vision",
  "src/content/blog/responsible-travel-gilgit-baltistan.md": "Responsible Travel in Gilgit-Baltistan | Karakoram Vision",
  "src/content/pages/about-us.md": "About Us - Tour Operator in Skardu | Karakoram Vision",
  "src/content/pages/why-choose-us.md": "Why Travel With Us | Karakoram Vision Pakistan",
  "src/content/pages/faqs.md": "Pakistan Travel FAQs: Visa & Permits | Karakoram Vision",
  "src/content/pages/equipment-check-list.md": "Trekking Equipment Checklist | Karakoram Vision Pakistan",
  "src/content/pages/family-trip.md": "Family Tours in Pakistan | Karakoram Vision Pakistan",
  "src/content/pages/privacy-policy.md": "Privacy Policy | Karakoram Vision Pakistan",
  "src/content/pages/refund-policy.md": "Refund and Cancellation Policy | Karakoram Vision Pakistan",
  "src/content/pages/terms-and-conditions.md": "Terms and Conditions | Karakoram Vision Pakistan",
  "src/tours/index.njk": "Pakistan Tour Packages - Hunza & Skardu | Karakoram Vision",
  "src/trekking/index.njk": "Trekking in Pakistan - Karakoram Treks | Karakoram Vision",
  "src/expeditions/index.njk": "Mountaineering Expeditions in Pakistan | Karakoram Vision",
  "src/jeep-safaris/index.njk": "Jeep Safaris in Pakistan - 4x4 Tours | Karakoram Vision",
  "src/vehicles/index.njk": "Vehicle Rental in Skardu & Gilgit | Karakoram Vision",
  "src/destinations/index.njk": "Destinations in Northern Pakistan | Karakoram Vision",
  "src/blog/index.njk": "Pakistan Travel Guides & Tips | Karakoram Vision Pakistan",
  "src/plan-a-trip/index.njk": "Plan a Custom Pakistan Trip | Karakoram Vision Pakistan",
  "src/contact-us/index.njk": "Contact Us - Tour Operator in Skardu | Karakoram Vision",
  "src/guest-reviews/index.njk": "Guest Reviews & Testimonials | Karakoram Vision Pakistan",
  "src/international-travelers/index.njk": "Travel to Pakistan: Guide for Visitors | Karakoram Vision",
  "src/travel-resources/index.njk": "Pakistan Travel Resources & Permits | Karakoram Vision",
  "src/hunting-services/index.njk": "Hunting Permits & Logistics in Pakistan | Karakoram Vision",
  "src/special-interests/index.njk": "Special Interest Tours in Pakistan | Karakoram Vision",
  "src/holiday-types/index.njk": "Holiday Types in Pakistan | Karakoram Vision Pakistan",
  "src/news/index.njk": "Travel News & Updates | Karakoram Vision Pakistan",
  "src/social-responsibility/index.njk": "Social Responsibility | Karakoram Vision Pakistan",
  "src/trip-calendar/index.njk": "Trip Calendar & Fixed Departures | Karakoram Vision",
  "src/search/index.njk": "Search | Karakoram Vision Pakistan",
  "src/journey-categories/index.njk": "Journey Categories | Karakoram Vision Pakistan",
  "src/expeditions/fixed-departures/index.njk": "Fixed Departure Expeditions | Karakoram Vision Pakistan",
  "src/expeditions/8000m-peaks/index.njk": "8000m Peak Expeditions in Pakistan | Karakoram Vision",
  "src/trekking/fixed-departures/index.njk": "Fixed Departure Treks in Pakistan | Karakoram Vision",
  "src/trekking/k2-treks/index.njk": "K2 Treks & Baltoro Glacier Routes | Karakoram Vision",
  "src/trekking/best-sellers/index.njk": "Best-Selling Treks in Pakistan | Karakoram Vision",
  "src/tours/fixed-departures/index.njk": "Fixed Departure Tours in Pakistan | Karakoram Vision",
  "src/tours/cultural-tours/index.njk": "Cultural Tours in Pakistan | Karakoram Vision Pakistan",
};

const rx = /(^seo:[^\r\n]*\r?\n(?:[ \t]+[^\r\n]*\r?\n)*?[ \t]+title:)[ \t]*[^\r\n]*/m;
let changed = 0, same = 0, missing = 0, tooLong = 0;
for (const [file, title] of Object.entries(TITLES)) {
  if (title.length > 60) { tooLong++; console.log(`!! ${title.length} chars: ${title}`); }
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); missing++; continue; }
  const text = fs.readFileSync(file, 'utf8');
  const mm = text.match(rx);
  if (!mm) { console.log(`NO seo.title  ${file}`); missing++; continue; }
  const old = (mm[0].split('title:')[1] || '').trim().replace(/^["']|["']$/g, '');
  if (old === title) { same++; continue; }
  console.log(`${file}\n   - ${old}\n   + ${title}  (${title.length})`);
  changed++;
  if (WRITE) fs.writeFileSync(file, text.replace(rx, `$1 "${title}"`));
}
console.log(`\n${changed} pages ${WRITE ? 'changed' : 'would change'}, ${same} already fine, ${missing} problems, ${tooLong} over 60 characters.`);
if (!WRITE) console.log('Abhi kuch change nahi hua. Apply karne ke liye dobara --write ke saath chalayein.');
