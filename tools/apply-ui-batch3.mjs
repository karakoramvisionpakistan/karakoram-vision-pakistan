// Batch 3 - floating contact buttons ko chhota aur saaf karna:
//   1. WhatsApp / WeChat / Let's Talk ab gol icon button (46px), label hover par tooltip
//   2. "Let's Talk" button ko aria-label (mobile par label chhupta hai, naam baqi rahe)
//   3. site.css ka naya version (purani CSS cache na chale) aur preload bhi wahi version
//
//   node tools/apply-ui-batch3.mjs           -> sirf dikhata hai
//   node tools/apply-ui-batch3.mjs --write   -> files badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
let changed = 0, skipped = 0, problems = 0;

const CSS_VER = '11.1.0';

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

// ---------- 1. CSS: compact gol buttons + tooltip ----------
patch('src/assets/css/input.css', 'Floating contact buttons: chhote gol, label tooltip par', (t) => {
  if (t.includes('/* bk-floating v2 */')) return null;

  const OLD_STACK = '.bk-floating-contact-stack{position:fixed;right:1rem;bottom:1rem;z-index:220;display:grid;justify-items:end;gap:.65rem}';
  if (!t.includes(OLD_STACK)) throw new Error('input.css mein floating stack wali line nahi mili');

  // purani 6 lines (stack se colors tak) ek sath replace
  const start = t.indexOf(OLD_STACK);
  const colorsLine = '.bk-floating-whatsapp{background:#16a34a}.bk-floating-wechat{background:#22c55e}.bk-floating-other{background:#ff5a1f}';
  const colorsAt = t.indexOf(colorsLine, start);
  if (colorsAt === -1) throw new Error('input.css mein floating colors wali line nahi mili');
  const end = colorsAt + colorsLine.length;

  const neu = [
    '/* bk-floating v2 */',
    '.bk-floating-contact-stack{position:fixed;right:1rem;bottom:1rem;z-index:220;display:grid;justify-items:end;gap:.5rem}',
    '.bk-floating-contact-button{position:relative;display:grid;place-items:center;width:46px;height:46px;min-height:0;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:999px;color:#fff;font-weight:900;box-shadow:0 8px 22px rgba(2,6,23,.28);transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}',
    '.bk-floating-contact-button:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(2,6,23,.36);filter:brightness(1.06)}',
    '.bk-floating-contact-button .bk-icon{width:1.3rem;height:1.3rem;flex:none}',
    '.bk-floating-contact-button>span{position:absolute;right:calc(100% + .5rem);top:50%;transform:translateY(-50%);display:block;white-space:nowrap;border-radius:8px;background:#0f172a;padding:.34rem .6rem;color:#fff;font-size:.72rem;font-weight:800;line-height:1.1;text-align:right;opacity:0;pointer-events:none;transition:opacity .18s ease;box-shadow:0 8px 20px rgba(2,6,23,.3)}',
    '.bk-floating-contact-button:hover>span,.bk-floating-contact-button:focus-visible>span{opacity:1}',
    '.bk-floating-contact-button small{display:none}',
    colorsLine,
  ].join('\n');

  let out = t.slice(0, start) + neu + t.slice(end);

  // mobile: wahi naap, label band
  const OLD_M = '.bk-floating-contact-stack{right:.65rem;bottom:.65rem}.bk-floating-contact-button{width:54px;height:54px;min-height:54px;padding:.65rem}.bk-floating-contact-button>span{display:none}';
  const NEW_M = '.bk-floating-contact-stack{right:.75rem;bottom:.75rem}.bk-floating-contact-button{width:46px;height:46px}.bk-floating-contact-button>span{display:none}';
  if (out.includes(OLD_M)) out = out.replace(OLD_M, NEW_M);
  else console.log('   note: mobile wali line nahi mili - desktop rules phir bhi lag gaye');

  return out;
});

// ---------- 2. "Let's Talk" button ka aria-label ----------
patch('src/_includes/components/floating-contact.njk', '"Let\'s Talk" button ko aria-label', (t) => {
  if (t.includes('aria-label="Other ways to contact')) return null;
  const old = 'data-open-contact aria-haspopup="dialog" aria-controls="contact-modal"';
  if (!t.includes(old)) throw new Error('floating-contact.njk mein "Let\'s Talk" button nahi mila');
  return t.replace(old, 'data-open-contact aria-haspopup="dialog" aria-controls="contact-modal" aria-label="Other ways to contact Karakoram Vision Pakistan"');
});

// ---------- 3. site.css ka naya version ----------
patch('src/_includes/layouts/base.njk', `site.css ka version ${CSS_VER}`, (t) => {
  if (t.includes(`site.css?v=${CSS_VER}`) && t.includes(`href="/assets/css/site.css?v=${CSS_VER}" as="style"`)) return null;
  let out = t;
  // stylesheet
  out = out.replace(/\/assets\/css\/site\.css\?v=[\d.]+/g, `/assets/css/site.css?v=${CSS_VER}`);
  // preload bhi wahi URL, warna browser do baar download karta hai
  out = out.replace('<link rel="preload" href="/assets/css/site.css" as="style">',
    `<link rel="preload" href="/assets/css/site.css?v=${CSS_VER}" as="style">`);
  if (out === t) throw new Error('base.njk mein site.css wali line nahi mili');
  return out;
});

patch('src/_headers', `_headers mein site.css preload ka version ${CSS_VER}`, (t) => {
  if (t.includes(`site.css?v=${CSS_VER}`)) return null;
  const rx = /<\/assets\/css\/site\.css(\?v=[\d.]+)?>; rel=preload; as=style/;
  if (!rx.test(t)) throw new Error('_headers mein site.css ka preload nahi mila');
  return t.replace(rx, `</assets/css/site.css?v=${CSS_VER}>; rel=preload; as=style`);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
