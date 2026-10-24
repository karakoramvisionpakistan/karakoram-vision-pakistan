// Batch 1 (doosra hissa) - Guest Reviews ko About Us se nikaal kar homepage par lana:
//   1. Homepage par naya "reviews" section (CMS se on/off aur text badla ja sakta hai)
//   2. Footer mein Guest Reviews ka link
//   3. About Us ke menu se Guest Reviews hata dena
//   4. CMS (.pages.yml) mein naye section ke khane
//   5. reviews script ka naya version (purani cache na chale)
//
//   node tools/apply-ui-batch2.mjs           -> sirf dikhata hai
//   node tools/apply-ui-batch2.mjs --write   -> files badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
let changed = 0, skipped = 0, problems = 0;

const SCRIPT_VER = '11.1.0';

function patch(file, label, fn) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; return; }
  const before = fs.readFileSync(file, 'utf8');
  let after;
  try { after = fn(before); } catch (e) { console.log(`!! ${label}\n   ${e.message}`); problems++; return; }
  if (after === null) { console.log(`   pehle se theek: ${label}`); skipped++; return; }
  if (after === before) { console.log(`   koi tabdeeli nahi: ${label}`); skipped++; return; }
  console.log(`${WRITE ? 'badla' : 'badlega'}: ${label}  (${file})`);
  changed++;
  if (WRITE) fs.writeFileSync(file, after, 'utf8');
}

const nlOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

// ---------- 1. homepage par reviews ka section ----------
patch('src/index.njk', 'Homepage par Guest Reviews ka section', (t) => {
  if (t.includes("section == 'reviews'")) return null;
  const anchor = "  {% elseif section == 'guides' and hp.guides.enabled !== false %}";
  if (!t.includes(anchor)) throw new Error("index.njk mein guides wala section nahi mila");
  const nl = nlOf(t);
  const block = [
    "  {% elseif section == 'reviews' and hp.reviews.enabled !== false %}",
    '  {# Yeh section JS tab dikhata hai jab koi review publish ho - khali section nazar nahi aata #}',
    '  <section class="bk-home-section" data-reviews-section hidden><header class="bk-section-heading">'
      + '<div><p class="eyebrow">{{ hp.reviews.eyebrow }}</p><h2>{{ hp.reviews.heading }}</h2>'
      + '<p>{{ hp.reviews.description }}</p></div>'
      + '<a class="bk-heading-link" href="{{ hp.reviews.button_url or \'/guest-reviews/\' }}">'
      + "{{ hp.reviews.button_label or 'Read all reviews' }}</a></header>"
      + '<div data-reviews-list data-reviews-limit="{{ hp.reviews.card_count or 3 }}"'
      + ' class="mt-8 grid gap-5 md:grid-cols-3"></div>'
      + `<script src="/assets/js/guest-reviews.js?v=${SCRIPT_VER}" defer></script></section>`,
    '',
  ].join(nl);
  return t.replace(anchor, block + anchor);
});

// ---------- 2. homePage.json: reviews ki settings ----------
patch('src/_data/homePage.json', 'Homepage settings: reviews section ka data', (t) => {
  const data = JSON.parse(t);
  const order = data.section_order;
  if (!Array.isArray(order)) throw new Error('homePage.json mein section_order nahi mila');
  if (data.reviews && order.includes('reviews')) return null;

  if (!data.reviews) {
    data.reviews = {
      enabled: true,
      eyebrow: 'Traveller feedback',
      heading: 'What our guests say',
      description: 'Reviews from travellers who have joined our tours, treks and expeditions.',
      button_label: 'Read all reviews',
      button_url: '/guest-reviews/',
      card_count: 3,
    };
  }
  if (!order.includes('reviews')) {
    const at = order.indexOf('trust');
    order.splice(at === -1 ? order.length : at + 1, 0, 'reviews');
  }

  // reviews ko guides se pehle rakhna, taake file padhne mein bhi tartib rahe
  const want = ['hero', 'section_order', 'proof', 'services', 'latest', 'fixed',
    'destinations', 'vehicles', 'trust', 'reviews', 'guides', 'resources', 'faqs', 'cta'];
  const out = {};
  for (const k of want) if (k in data) out[k] = data[k];
  for (const k of Object.keys(data)) if (!(k in out)) out[k] = data[k];

  return JSON.stringify(out, null, 2) + nlOf(t);
});

// ---------- 3. footer mein link ----------
patch('src/_data/siteFooter.json', 'Footer mein Guest Reviews ka link', (t) => {
  const data = JSON.parse(t);
  const cols = data.columns;
  if (!Array.isArray(cols)) throw new Error('siteFooter.json mein columns nahi mile');
  const already = cols.some((c) => (c.links || []).some((l) => l.url === '/guest-reviews/'));
  if (already) return null;

  const col = cols.find((c) => (c.links || []).some((l) => l.url === '/social-responsibility/'))
    || cols[cols.length - 1];
  const at = col.links.findIndex((l) => l.url === '/social-responsibility/');
  col.links.splice(at === -1 ? col.links.length : at + 1, 0,
    { label: 'Guest Reviews', url: '/guest-reviews/' });

  return JSON.stringify(data, null, 2) + nlOf(t);
});

// ---------- 4. About Us ke menu se hatana ----------
patch('src/_data/menu.json', 'About Us ke menu se Guest Reviews hatana', (t) => {
  const data = JSON.parse(t);
  let removed = 0;
  const strip = (list) => {
    if (!Array.isArray(list)) return;
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      if (!item || typeof item !== 'object') continue;
      if (item.url === '/guest-reviews/') { list.splice(i, 1); removed++; continue; }
      strip(item.children);
    }
  };
  strip(data.items);
  if (!removed) return null;
  return JSON.stringify(data, null, 2) + nlOf(t);
});

// ---------- 5. CMS: section_order mein naya option ----------
patch('.pages.yml', 'CMS: homepage section order mein "reviews"', (t) => {
  const anchor = '    - trust\n    - guides\n    - resources\n    - faqs\n    - cta';
  const anchorCRLF = anchor.replace(/\n/g, '\r\n');
  const has = t.includes(anchor) || t.includes(anchorCRLF);
  if (!has) {
    if (/^\s+- reviews$/m.test(t)) return null;
    throw new Error('.pages.yml mein section order ki list nahi mili');
  }
  const nl = t.includes(anchorCRLF) ? '\r\n' : '\n';
  const from = nl === '\r\n' ? anchorCRLF : anchor;
  return t.replace(from, `    - trust${nl}    - reviews${nl}    - guides${nl}    - resources${nl}    - faqs${nl}    - cta`);
});

// ---------- 6. CMS: reviews section ke khane ----------
patch('.pages.yml', 'CMS: reviews section ke khane (homepage screen par)', (t) => {
  if (t.includes('label: Guest reviews on homepage')) return null;
  const anchor = '  - name: guides\n    label: Travel guides';
  const anchorCRLF = anchor.replace(/\n/g, '\r\n');
  const useCRLF = !t.includes(anchor) && t.includes(anchorCRLF);
  if (!t.includes(anchor) && !useCRLF) throw new Error('.pages.yml mein guides wala block nahi mila');
  const nl = useCRLF ? '\r\n' : '\n';
  const block = [
    '  - name: reviews',
    '    label: Guest reviews on homepage',
    '    type: object',
    '    fields:',
    '    - name: enabled',
    '      label: Show section',
    '      type: boolean',
    '      default: true',
    '      description: Reviews khud ba khud aati hain. Koi review publish na ho to section nazar nahi aayega.',
    '    - name: eyebrow',
    '      label: Eyebrow',
    '      type: string',
    '    - name: heading',
    '      label: Heading',
    '      type: string',
    '    - name: description',
    '      label: Description',
    '      type: text',
    '    - name: button_label',
    '      label: Button label',
    '      type: string',
    '    - name: button_url',
    '      label: Button URL',
    '      type: string',
    '    - name: card_count',
    '      label: Reviews to show',
    '      type: number',
    '      options:',
    '        min: 1',
    '        max: 12',
    '',
  ].join(nl);
  return t.replace(useCRLF ? anchorCRLF : anchor, block + (useCRLF ? anchorCRLF : anchor));
});

// ---------- 7. reviews page par script ka naya version ----------
patch('src/guest-reviews/index.njk', `Reviews script ka version ${SCRIPT_VER}`, (t) => {
  if (t.includes(`guest-reviews.js?v=${SCRIPT_VER}`)) return null;
  const rx = /guest-reviews\.js\?v=[\d.]+/;
  if (!rx.test(t)) throw new Error('guest-reviews page par script wali line nahi mili');
  return t.replace(rx, `guest-reviews.js?v=${SCRIPT_VER}`);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
