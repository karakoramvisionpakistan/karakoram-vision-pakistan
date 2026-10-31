#!/usr/bin/env node
/**
 * add-faq-and-credentials.mjs   (website ke folder mein)
 *
 * DO KAAM:
 *
 * 1. FAQ bank — sattarah aam sawal har trip par, uske apne sawalon ke baad.
 *    Zyada tar jawab woh haqeeqi tafseel hain jo client ne di: porter ka
 *    wazan, Alpha Insurance, Alpine Club ki sanad, satellite phone aur
 *    radios, 50% deposit, Islamabad mein baqi adaigi.
 *
 * 2. License aur membership — footer par, har safhe pr. Muqabil isi se
 *    shuru karta hai (licence 1814, licence 402); aap ke paas yeh hai aur
 *    website kuch nahi kehti thi.
 *
 *   node tools/add-faq-and-credentials.mjs            -> sirf dekhna
 *   node tools/add-faq-and-credentials.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= FAQ bank ====== */

const FAQ_BANK = [
  {
    question: 'Do I need a visa for Pakistan?',
    answer: 'Most nationalities apply online through the official e-visa portal. A tourist application normally needs an invitation letter and tour confirmation from a licensed Pakistani operator, which we issue once your booking is confirmed. Apply four to six weeks ahead; the online process is often quicker, but flights and permits are easier to arrange with the visa already in hand.',
  },
  {
    question: 'Is travel insurance compulsory?',
    answer: 'Yes. You must arrive with your own policy, and it has to cover search and rescue at the altitude of your trip as well as medical treatment and repatriation. Ordinary holiday insurance excludes both. Global Rescue is the policy we see most often, and several other insurers cover high-altitude search and rescue in the Karakoram. Send us the policy number and the insurer\'s emergency line before you travel: in an emergency we contact your insurer directly, and that call cannot wait while paperwork is found.',
  },
  {
    question: 'Are the porters and staff insured?',
    answer: 'Yes. Karakoram Vision Pakistan insures every member of staff and every porter through Alpha Insurance before a trek or expedition begins. Porters in Gilgit-Baltistan do not normally carry insurance of their own, so this is arranged and paid for by us rather than left to them. Porters are paid at the official Gilgit-Baltistan rates, and above them where the ground or the season justifies it.',
  },
  {
    question: 'How much do porters carry, and what do I carry?',
    answer: 'A porter carries 25 kg on a normal trek and 20 kg where the route crosses a high pass, which is harder ground and thinner air. Your own duffle bag can weigh up to 25 kg and is carried for you. You walk with a daypack holding water, layers, camera and whatever you need during the day.',
  },
  {
    question: 'Who are the guides, and what are they qualified in?',
    answer: 'Our guides hold government licences, most are fluent in English and several speak other languages, and the majority are certified by the Alpine Club of Pakistan. They are from these valleys rather than brought in for the season, which matters when the weather turns or a route has changed since last year.',
  },
  {
    question: 'How fit do I need to be?',
    answer: 'Fit enough to walk six to eight hours on rough ground, several days in a row, carrying a daypack. Most people who prepare succeed; most people who do not, struggle by the fourth day. Three to four months of regular hill walking with a loaded pack is the preparation that works. Technical climbing skill is only needed on the trips where we say so.',
  },
  {
    question: 'What happens about altitude?',
    answer: 'Our itineraries gain height gradually and include rest days where the profile needs them. Mild headache and poor sleep are common above 3,500m; genuine altitude sickness is not, and it is treated by descending. Guides carry a first aid kit and oxygen, watch the group daily, and will send someone down when that is the safe decision. Expeditions carry considerably more medical equipment. Never hide symptoms to keep up with the group.',
  },
  {
    question: 'Is there any way to call for help on the trek?',
    answer: 'Yes. A satellite phone and radios travel on every trek, not only on expeditions. Mobile signal reaches Skardu and the larger valleys but stops well before the glaciers, so the satellite phone is the link for weather, logistics and emergencies, and the radios keep the group in contact when it is spread along a long day.',
  },
  {
    question: 'What permits are needed?',
    answer: 'A trekking permit for the Central Karakoram National Park is issued free, and a park fee is paid per trekker; the rate is set each year by the Gilgit-Baltistan tourism department. Restricted zones need their own permit. Peaks above 6,500m need a climbing permit from the Alpine Club of Pakistan, applied for about three months ahead, and the royalty differs from peak to peak. For our expeditions the royalty is included in the price. We handle the paperwork, the registration in Skardu and the roadhead arrangements.',
  },
  {
    question: 'How do I book and pay?',
    answer: 'Send your dates, group size and the trip you have in mind, and you receive a written itinerary and a full cost breakdown before any payment is discussed. A deposit of 50 per cent confirms the booking and starts the permit and visa paperwork. The remaining 50 per cent is paid after you reach Islamabad and before you travel to Skardu, in euros or US dollars, or by bank transfer. Prices differ from trip to trip, so there is no single rate to quote.',
  },
  {
    question: 'What equipment can I hire instead of bringing?',
    answer: 'We hire out sleeping bags, and a wide range of trekking and climbing gear is available to rent in Skardu, so you do not have to fly with everything. Tell us what you would rather hire when you book and it is set aside before you arrive. Boots are the exception: bring your own, worn in.',
  },
  {
    question: 'How much should I tip?',
    answer: 'Tips are not fixed and are entirely at your discretion. What usually happens is that the group agrees an amount with the guide at the end of the trip and it is shared among the crew. Nobody will ask you for a figure beforehand.',
  },
  {
    question: 'What is the food like, and can you cater for my diet?',
    answer: 'A kitchen crew travels with the group — one or more cooks with assistants and waiters, depending on the size of the party — and meals are prepared in a kitchen tent: breakfast, a packed or hot lunch, and a cooked dinner, built around local staples with plenty of rice, lentils, bread, eggs and seasonal vegetables. Tell us about vegetarian, halal, allergy or other requirements when you book and they are planned for rather than improvised on the glacier.',
  },
  {
    question: 'Where do we sleep?',
    answer: 'Hotels in Skardu and at the roadhead, and camping on trek, with a mess tent and toilet tents kept entirely separate from the sleeping tents. A single tent can be arranged if you would rather not share, and single occupancy in hotels is possible for a supplement.',
  },
  {
    question: 'How do I get to Skardu, and what if the flight is cancelled?',
    answer: 'There are flights from Islamabad to Skardu, and they depend on the weather in the mountains, so cancellation is normal rather than exceptional. The alternative is the road, about two days along the Karakoram Highway and the Skardu road, and a journey worth having in its own right. Build spare days into your travel at both ends and hold a flexible ticket home.',
  },
  {
    question: 'Is it safe to trek in Gilgit-Baltistan?',
    answer: 'Gilgit-Baltistan is the part of Pakistan built around mountain tourism, and these valleys have hosted foreign teams for decades. Foreign trekkers are registered before leaving Skardu, our staff travel with the group throughout, and a satellite phone and radios are carried on every trip. Check your own government\'s travel advice as well, since advisories change and your insurance may depend on them.',
  },
  {
    question: 'Can you run this on private dates?',
    answer: 'Yes. Almost every trip can run for a couple, a family or a private group on dates that suit you, and the cost changes with the number of people. Send the dates you are considering and you will get a written itinerary and price for that group size.',
  },
];

console.log('\n1) FAQ bank');

const BANK = path.join(ROOT, 'src', '_data', 'faqBank.json');
const bankText = JSON.stringify(FAQ_BANK, null, 2) + '\n';
if (read(BANK) === bankText) console.log('   OK  pehle se theek hai.');
else { writes.push({ file: BANK, text: bankText }); console.log('   ->  ' + FAQ_BANK.length + ' sawal'); }

console.log('\n2) Build ke waqt har trip par lagana');

const DATA = path.join(ROOT, 'src', 'content', 'content.11tydata.js');
const probe = read(path.join(ROOT, 'src', '_data', 'photoGallery.js')) || '';
const ESM = /export\s+default/.test(probe) || !/module\.exports/.test(probe);

const BODY = `// Khud bani file — tools/add-faq-and-credentials.mjs
//
// Har journey ke apne FAQ ke BAAD aam sawalon ka bank laga deta hai.
// Content files chhui nahi jatin: jurRna yahan hota hai, is liye bank
// ek jagah badalne se sab trips par badal jata hai. Schema bhi isi
// mili hui fehrist se banta hai.
//
// Jo sawal trip ne khud likha ho, bank ka wahi sawal nazar andaaz ho
// jata hai — trip ka apna jawab hamesha bhaari rehta hai.

const key = (q) => String(q || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const config = {
  eleventyComputed: {
    faqs: (data) => {
      const own = Array.isArray(data.faqs) ? data.faqs : [];
      if (!data.service_type) return own;   // sirf journeys par
      const bank = Array.isArray(data.faqBank) ? data.faqBank : [];
      const seen = new Set(own.map((f) => key(f && f.question)));
      return own.concat(bank.filter((f) => f && f.question && !seen.has(key(f.question))));
    },
  },
};
`;
const TEXT = ESM ? BODY + '\nexport default config;\n' : BODY + '\nmodule.exports = config;\n';
if (read(DATA) === TEXT) console.log('   OK  pehle se hai.');
else { writes.push({ file: DATA, text: TEXT }); console.log('   ->  content.11tydata.js'); }

/* ======================================================= credentials === */

console.log('\n3) License aur membership — site.json');

const SITE = path.join(ROOT, 'src', '_data', 'site.json');
const siteRaw = read(SITE);
if (!siteRaw) { console.log('XX  site.json nahi mili.'); process.exit(1); }

let site;
try { site = JSON.parse(siteRaw); }
catch (e) { console.log('XX  site.json parse fail: ' + e.message); process.exit(1); }

const CRED = {
  show: true,
  licence_label: 'Government licence',
  licence_number: 'DTS-GB-TO/00071',
  memberships: ['PATO', 'GBTOA', 'BAATO'],
  registered_with: ['SECP', 'FBR'],
  experience_note: '35 years in Pakistan tourism; our first company was registered in 2005',
};

if (site.credentials) console.log('   OK  pehle se hai.');
else {
  site.credentials = CRED;
  writes.push({ file: SITE, text: JSON.stringify(site, null, 2) + '\n', bak: true });
  console.log('   ->  licence DTS-GB-TO/00071, PATO/GBTOA/BAATO, SECP/FBR');
}

/* ---- component ---- */

console.log('\n4) Footer par dikhana');

const COMP = path.join(ROOT, 'src', '_includes', 'components', 'credentials.njk');
const COMP_TEXT = `{# License aur membership. Muqabil yahi sab se pehle dikhata hai; yeh
   bharose ka seedha nishan hai aur Google ke E-E-A-T mein ginti mein aata hai.

   Har baat alag likhi hai aur koi dawa milaya nahi gaya: company 2026 mein
   private limited bani, pehli company 2005 mein, aur team ka tajurba 35 saal
   ka hai. Teenon sach hain, aur alag likhne se koi tazaad nahi banta. #}
{% set c = site.credentials or {} %}
{% if c.show !== false and c.licence_number %}
<div class="bk-credentials">
  <p>
    <strong>{{ c.licence_label or 'Government licence' }} {{ c.licence_number }}</strong>
    {% if c.memberships and c.memberships.length %}
      <span aria-hidden="true">·</span> Member of {{ c.memberships | join(', ') }}
    {% endif %}
    {% if c.registered_with and c.registered_with.length %}
      <span aria-hidden="true">·</span> Registered with {{ c.registered_with | join(' and ') }}
    {% endif %}
  </p>
  {% if c.experience_note %}<p class="bk-credentials-note">{{ c.experience_note }}</p>{% endif %}
</div>
{% endif %}
`;
if (read(COMP) === COMP_TEXT) console.log('   OK  component pehle se hai.');
else { writes.push({ file: COMP, text: COMP_TEXT }); console.log('   ->  components/credentials.njk'); }

/* ---- footer mein ---- */

const FOOTER = path.join(ROOT, 'src', '_includes', 'components', 'footer.njk');
let footer = read(FOOTER);
if (!footer) console.log('   !   footer.njk nahi mili.');
else if (footer.includes('credentials.njk')) console.log('   OK  footer mein pehle se hai.');
else {
  const anchor = '  <div class="bk-footer-bottom">';
  if (!footer.includes(anchor)) console.log('   !   footer mein jagah nahi mili.');
  else {
    footer = footer.replace(anchor, '  {% include "components/credentials.njk" %}\n' + anchor);
    writes.push({ file: FOOTER, text: footer, bak: true });
    console.log('   ->  footer mein juR gaya (bottom bar se oopar)');
  }
}

/* ---- CSS ---- */

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
const css = read(CSS);
const MARK = '/* === Credentials (V11.21) === */';
if (!css) console.log('   !   input.css nahi mili.');
else if (css.includes(MARK)) console.log('   OK  CSS pehle se hai.');
else {
  const BLOCK = `

${MARK}
.bk-credentials {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.5rem 1.25rem;
}
.bk-credentials p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
}
.bk-credentials strong { color: rgba(255, 255, 255, 0.92); font-weight: 600; }
.bk-credentials-note { margin-top: 0.2rem !important; opacity: 0.82; }
/* === Credentials END === */
`;
  writes.push({ file: CSS, text: css.trimEnd() + '\n' + BLOCK, bak: true });
  console.log('   ->  CSS juR gayi');
}

/* ---- CMS screen ---- */

console.log('\n5) CMS mein badalne ke qaabil banana');

const YML = path.join(ROOT, '.pages.yml');
const ymlRaw = read(YML);
if (!ymlRaw) console.log('   !   .pages.yml nahi mili.');
else {
  const doc = yaml.load(ymlRaw);
  const screen = (doc.content || []).find((c) => c.name === 'site');
  if (!screen) console.log('   !   "site" screen nahi mila.');
  else if ((screen.fields || []).some((f) => f.name === 'credentials')) {
    console.log('   OK  pehle se hai.');
  } else {
    const before = screen.fields.length;
    screen.fields.push({
      name: 'credentials',
      label: 'Licence and memberships',
      type: 'object',
      description: 'Shown at the bottom of every page.',
      fields: [
        { name: 'show', label: 'Show this', type: 'boolean' },
        { name: 'licence_label', label: 'Licence label', type: 'string' },
        { name: 'licence_number', label: 'Licence number', type: 'string' },
        { name: 'memberships', label: 'Memberships', type: 'string', list: true },
        { name: 'registered_with', label: 'Registered with', type: 'string', list: true },
        { name: 'experience_note', label: 'Experience note', type: 'text' },
      ],
    });
    const dumped = yaml.dump(doc, { lineWidth: -1, noRefs: true });
    const check = yaml.load(dumped);
    const after = (check.content || []).find((c) => c.name === 'site');
    if (!after || after.fields.length !== before + 1) {
      console.log('   XX  jaanch nakaam — rok raha hoon.');
      process.exit(1);
    }
    writes.push({ file: YML, text: dumped, bak: true });
    console.log('   ->  "Business details" mein naya hissa (jaanch theek)');
  }
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s). Lagane ke liye:');
  console.log('   node tools/add-faq-and-credentials.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  fs.mkdirSync(path.dirname(w.file), { recursive: true });
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak16')) fs.copyFileSync(w.file, w.file + '.bak16');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
