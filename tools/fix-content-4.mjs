#!/usr/bin/env node
/**
 * fix-content-4.mjs   (WEBSITE ke folder mein:  D:\Websites\Karakoram_Vision_Pakistan)
 *
 * Naya blog: "Pakistan Trekking Permits and Visa" guide.
 * Har baat sarkari ya taaza (2026) sources se check ki gayi hai; fees ki raqam
 * jaan bujh kar nahi likhi, kyun ke woh har saal badalti hai.
 *
 *   node tools/fix-content-4.mjs            -> sirf jaanch
 *   node tools/fix-content-4.mjs --write    -> nayi file likh deta hai
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const WRITE = process.argv.includes('--write');
const TODAY = '2026-11-07';
const P = (rel) => path.join(process.cwd(), ...rel.split('/'));
let yaml;
try { yaml = createRequire(P('package.json'))('js-yaml'); } catch { console.log('XX js-yaml nahi mila - npm install'); process.exit(1); }
const problems = [], report = [], plan = [];
const J = (...a) => a.join('\n');
const FM = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const dump = (d) => yaml.dump(d, { lineWidth: 100, noRefs: true, quotingType: '"' });
const readFM = (rel) => {
  if (!fs.existsSync(P(rel))) return null;
  const m = FM.exec(fs.readFileSync(P(rel), 'utf8').replace(/\r\n/g, '\n'));
  return m ? (yaml.load(m[1]) || {}) : null;
};

const REL = 'src/content/blog/pakistan-trekking-permits-visa.md';
const BLOG = 'src/content/blog';

/* ------------------------------------------------ pehle se koi visa/permit blog? */
if (fs.existsSync(P(BLOG))) {
  for (const f of fs.readdirSync(P(BLOG)).filter((x) => x.endsWith('.md'))) {
    if (`${BLOG}/${f}` === REL) continue;
    const d = readFM(`${BLOG}/${f}`);
    const t = `${d?.title || ''} ${d?.seo?.title || ''}`;
    if (/visa|permit/i.test(t)) report.push(`  !!     milta julta blog pehle se: ${BLOG}/${f}  ("${d.title}") - mujhe batayein, takraav (cannibalization) na ho`);
  }
} else problems.push(`${BLOG}: folder nahi mila`);

/* ------------------------------------------------ cover photo */
const COVERS = ['src/content/trekking/gondogoro-la-circuit-trek.md', 'src/content/trekking/k2-base-camp-baltoro-trek.md', 'src/content/trekking/nangma-valley-trek.md'];
let cover = '', coverAlt = '', coverFrom = '';
for (const c of COVERS) { const d = readFM(c); if (d?.cover_image) { cover = d.cover_image; coverAlt = d.cover_image_alt || ''; coverFrom = c; break; } }
if (!cover) problems.push('cover photo kisi trek page se nahi mili');
coverAlt = coverAlt || 'Trekkers in the Karakoram mountains of Gilgit-Baltistan, Pakistan';

/* ------------------------------------------------ content */
const summary = 'To trek in northern Pakistan you need the right visa and, for most famous routes such as K2 and the Baltoro, a trekking permit that only a licensed tour operator can apply for. This guide explains which visa to choose, which areas need a permit, what documents are needed and how long it takes.';

const faqs = [
  { question: 'Do I need a permit to trek in Pakistan?', answer: 'Only in restricted areas. Many valleys in Gilgit-Baltistan and Chitral are open and need no permit. The best-known routes, including the Baltoro to K2 base camp, the Gondogoro La and the Biafo-Hispar, are in restricted zones, where a trekking permit, a licensed guide and porters are compulsory.' },
  { question: 'Which visa do I need for the K2 base camp trek?', answer: 'Apply for the trekking visa on the Pakistan Online Visa System. Because the Baltoro is a restricted area, the visa is issued against your trekking permit, which your licensed tour operator applies for. A tourist visa is enough for open areas such as Hunza, Skardu town and Nangma.' },
  { question: 'Can I get a trekking permit myself?', answer: 'No. The application must come from a tour operator licensed in Gilgit-Baltistan, with its licence, a route map and the details of everyone in the group. When you book with us, we prepare and submit it for you.' },
  { question: 'How early should I start the visa and permit?', answer: 'Book at least two to three months before you travel. Permits and visas are processed one after the other, and delays with permits can hold up the visa, so starting early is the only reliable way to avoid a last-minute problem.' },
  { question: 'What about peaks above 6,500 metres?', answer: 'Climbing above 6,500 m needs a mountaineering permit and a mountaineering visa, with a royalty that depends on the height of the peak, and a liaison officer is assigned to the expedition. Peaks below that height are climbed on a trekking permit.' }
];

const body = J(
  '<h2><strong>The short answer</strong></h2>',
  '<p>Most trekkers need two things: a <strong>Pakistan visa</strong>, applied for online, and, for the famous routes in the Karakoram, a <strong>trekking permit</strong> from the Gilgit-Baltistan government. You cannot apply for the permit yourself; it must come from a licensed tour operator. When you book a trek with Karakoram Vision Pakistan, we handle the permit, the paperwork for your visa and the registration in Skardu.</p>',

  '<h2><strong>Step 1: choose the right visa</strong></h2>',
  '<p>Pakistan issues separate visas for tourists, trekkers and mountaineers. All are applied for on the official <a href="https://visa.nadra.gov.pk/" rel="nofollow noopener" target="_blank">Pakistan Online Visa System</a>.</p>',
  '<ul>',
  '<li><strong>Tourist visa:</strong> for sightseeing and for trekking in open areas, such as Hunza, Fairy Meadows or the Nangma valley.</li>',
  '<li><strong>Trekking visa:</strong> for treks in restricted areas, such as the Baltoro to <a href="/trekking/k2-base-camp-trek/">K2 base camp</a> or the <a href="/trekking/gondogoro-la-circuit-trek/">Gondogoro La</a>. It is issued once your trekking permit has been applied for through your operator.</li>',
  '<li><strong>Mountaineering visa:</strong> for climbing peaks above 6,500 m, issued against a mountaineering permit.</li>',
  '</ul>',
  '<p>You will need a passport valid for at least six months, a recent photo, your itinerary and the invitation or confirmation letter from your tour operator, which we send you after booking. Visa fees depend on your nationality and are shown on the portal when you apply.</p>',

  '<h2><strong>Step 2: does your route need a permit?</strong></h2>',
  '<p>Gilgit-Baltistan has <strong>open areas</strong>, where you can trek without a permit, and <strong>restricted areas</strong>, where a permit is required before you set off. The Baltoro and K2, the Gondogoro La, Snow Lake and the Biafo and Hispar glaciers are all restricted. So are the border strips: the area along the Line of Control and the strip along the Wakhan corridor, where photography is not allowed.</p>',
  '<p>In restricted areas the rules are simple: you must trek with a <strong>licensed guide and porters</strong>, organised by a licensed tour operator. Solo, unregistered trekking is not allowed there.</p>',

  '<h2><strong>Step 3: the trekking permit</strong></h2>',
  '<p>Your tour operator applies to the Gilgit-Baltistan Tourism Department with:</p>',
  '<ul>',
  '<li>an application on the operator\'s letterhead and a copy of its licence,</li>',
  '<li>a route map of the trek,</li>',
  '<li>copies of the passports of everyone in the group,</li>',
  '<li>proof of travel insurance,</li>',
  '<li>and payment of the trekking and environment fees.</li>',
  '</ul>',
  '<p>The fees change from year to year, so we do not quote them here. For our treks they are already included in the price; see our <a href="/blog/k2-base-camp-trek-cost/">K2 base camp trek cost guide</a> for what a typical package covers.</p>',

  '<h2><strong>Step 4: insurance</strong></h2>',
  '<p>Proof of insurance is part of the permit application. Make sure your policy covers trekking at the altitude you will reach and <strong>helicopter search and rescue in Pakistan</strong>. Ordinary travel insurance often does not, so read the policy wording or ask the insurer before you buy.</p>',

  '<h2><strong>Step 5: registration in Skardu</strong></h2>',
  '<p>Before you leave Skardu for the mountains, every foreign trekker is registered with the authorities, and your guide carries the permit for checks along the way. We arrange this on your rest day in Skardu, so there is nothing to queue for yourself.</p>',

  '<h2><strong>Climbing above 6,500 metres</strong></h2>',
  '<p>Peaks above 6,500 m are climbed on a <strong>mountaineering permit</strong>, not a trekking permit. It carries a royalty that depends on the height of the peak, an environment fee and a <strong>liaison officer</strong> who travels with the expedition. The royalty is paid in Pakistan, after the visa is granted. Applications should be made several months in advance. See our <a href="/expeditions/">expeditions</a> for peaks we organise.</p>',

  '<h2><strong>Timeline: when to start</strong></h2>',
  '<ul>',
  '<li><strong>3 months before:</strong> book your trek and send us the group details.</li>',
  '<li><strong>2 months before:</strong> we apply for the permit and send your visa letter; you apply for the visa online.</li>',
  '<li><strong>On arrival:</strong> the remaining 50% of the trek price is paid in Islamabad, and we register you in Skardu.</li>',
  '</ul>',
  '<p>Permits are processed before visas, and a delay in one holds up the other, so leaving it late is the most common reason trips are postponed.</p>',

  '<h2><strong>How we help</strong></h2>',
  '<p>Karakoram Vision Pakistan is a licensed tour operator based in Skardu. For every trek we book, we prepare and submit the permit application, issue your visa letter, pay the fees, register the group and provide the licensed guide and insured porters the rules require. Have a question about your own route? Read our <a href="/faqs/">FAQs</a> or <a href="/contact-us/">send us your dates</a>.</p>',

  '<h3><strong>Official sources</strong></h3>',
  '<ul>',
  '<li><a href="https://visa.nadra.gov.pk/" rel="nofollow noopener" target="_blank">Pakistan Online Visa System</a></li>',
  '<li><a href="https://tourismdept.gbit.gov.pk/pages/faqs" rel="nofollow noopener" target="_blank">Gilgit-Baltistan Tourism Department: FAQs</a></li>',
  '</ul>',
  '<p><em>Rules and fees can change at short notice. Last checked in November 2026; we confirm the current requirements with you when you book.</em></p>',
  ''
);

const data = {
  title: 'Pakistan Trekking Permits and Visa: A Step-by-Step Guide',
  slug: 'pakistan-trekking-permits-visa',
  permalink: '/blog/pakistan-trekking-permits-visa/',
  published: true,
  featured: true,
  summary,
  answer_summary: summary,
  cover_image: cover,
  cover_image_alt: coverAlt,
  categories: ['Travel Guides'],
  tags: ['Pakistan visa', 'Trekking permit', 'Gilgit-Baltistan', 'K2 base camp trek'],
  faqs,
  author: 'Karakoram Vision Editorial Team',
  reviewed_by: 'Karakoram Vision Travel Team',
  last_verified: TODAY,
  seo: {
    title: 'Pakistan Trekking Permit & Visa Guide 2027 | Karakoram Vision',
    description: 'Which Pakistan visa to get for trekking, which routes need a permit, the documents required and how long it takes, for K2, the Baltoro and Gondogoro La.',
    keywords: 'Pakistan trekking permit, Pakistan trekking visa, K2 trek permit, Gilgit-Baltistan permit, restricted area permit Pakistan',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    canonical: '',
    social_image: cover
  },
  layout: 'layouts/post.njk',
  date: TODAY
};

if (fs.existsSync(P(REL))) report.push(`  --     ${REL}: pehle se mojood`);
else {
  const out = `---\n${dump(data)}---\n\n${body}`;
  try { yaml.load(FM.exec(out)[1]); } catch (e) { problems.push(`YAML toota: ${e.message}`); }
  plan.push({ abs: P(REL), text: out });
  const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  report.push(`  nayi   ${REL}  (${words} alfaaz, ${faqs.length} FAQs, cover: ${coverFrom || 'XX'})`);
}

// andar ke links: jin pages ki taraf link hai woh mojood hain?
const LINKS = { '/trekking/k2-base-camp-trek/': 'trekking', '/trekking/gondogoro-la-circuit-trek/': 'trekking', '/blog/k2-base-camp-trek-cost/': 'blog', '/faqs/': 'pages', '/contact-us/': 'pages', '/expeditions/': 'expeditions' };
const allSrc = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (/node_modules|_site|\.git/.test(f)) continue; if (e.isDirectory()) walk(f); else if (/\.(md|njk)$/.test(e.name)) allSrc.push(f); } };
if (fs.existsSync('src')) walk('src');
const corpus = allSrc.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
for (const u of Object.keys(LINKS)) {
  const ok = corpus.includes(`permalink: ${u}`) || corpus.includes(`permalink: "${u}"`) || corpus.includes(`permalink: '${u}'`) || fs.existsSync(P(`src${u}index.njk`)) || fs.existsSync(P(`src${u}index.md`));
  report.push(`  ${ok ? 'link ' : '!! link'} ${u}${ok ? '' : '  (permalink nahi mila - build ke baad khol kar dekhein)'}`);
}

/* ------------------------------------------------ report */
console.log('\nCONTENT 4: PERMITS & VISA  ' + (WRITE ? '(LIKH RAHA HAI)' : '(sirf jaanch)'));
console.log('='.repeat(70));
report.forEach((r) => console.log(r));
if (problems.length) { console.log(`\nXX  ${problems.length} MASLA - KOI FILE NAHI BADLI:`); problems.forEach((p) => console.log('    - ' + p)); console.log('Yeh nateeja mujhe bhej dein.'); process.exit(1); }
if (!plan.length) { console.log('\nSab pehle se laga hua hai.'); process.exit(0); }
if (!WRITE) { console.log('\nTheek. Likhne ke liye:  node tools/fix-content-4.mjs --write'); process.exit(0); }
for (const x of plan) fs.writeFileSync(x.abs, x.text, 'utf8');
console.log('\nOK  nayi file likh di. Ab:  npm run build');
