#!/usr/bin/env node
/**
 * fix-three.mjs   (website ke folder mein)
 *
 * 1. Affiliated with: logo ke neeche CMS wala naam (chhoti likhai, logo ki
 *    chauRai ke andar, teen qataron tak)
 *
 * 2. Guide card ka khali button: CSS mein
 *      .bk-card-actions > a:first-child { text-blue-700 }
 *    zyada mazboot hai, aur guide card par wahi ek link button bhi hai —
 *    is liye neeli likhai neele background par gayab ho jati thi.
 *    Matn bhi "Read guide" se "Read more" ho raha hai.
 *
 * 3. FAQ ke jawab: faq-block.njk poori tarah Alpine par chal raha tha aur
 *    jawab x-cloak se chhupe hue the. Ab <details> par — bina JavaScript ke
 *    bhi khulega, aur Google jawab parh sakega.
 *
 *   node tools/fix-three.mjs            -> sirf dekhna
 *   node tools/fix-three.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const writes = [];
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };

/* ======================================================= 1) affiliations */

console.log('\n1) Affiliated with — logo ke neeche naam');

const AFF = path.join(ROOT, 'src', '_includes', 'components', 'affiliated-with.njk');
let aff = read(AFF);
if (!aff) { console.log('XX  affiliated-with.njk nahi mili.'); process.exit(1); }

const OLD_AFF = `      {% if item.url %}<a href="{{ item.url }}" target="_blank" rel="noopener noreferrer" title="{{ item.name }}">{% endif %}
        <img src="{{ item.logo }}" alt="{{ item.name }}" width="56" height="56" style="width:56px;height:56px;object-fit:contain" loading="lazy" decoding="async">
      {% if item.url %}</a>{% endif %}`;

const NEW_AFF = `      {% if item.url %}<a href="{{ item.url }}" target="_blank" rel="noopener noreferrer" title="{{ item.name }}">{% endif %}
        <img src="{{ item.logo }}" alt="{{ item.name }}" width="56" height="56" style="width:56px;height:56px;object-fit:contain" loading="lazy" decoding="async">
        {% if item.name %}<span class="bk-affiliation-name">{{ item.name }}</span>{% endif %}
      {% if item.url %}</a>{% endif %}`;

if (aff.includes('bk-affiliation-name')) console.log('   OK  naam pehle se laga hua hai.');
else if (!aff.includes(OLD_AFF)) console.log('   XX  logo wala hissa nahi pehchana — chhoR raha hoon.');
else { aff = aff.replace(OLD_AFF, NEW_AFF); writes.push({ file: AFF, text: aff, bak: true }); console.log('   ->  CMS wala naam logo ke neeche aa jayega.'); }

/* ======================================================= 2) post card == */

console.log('\n2) Guide card ka button');

const POST = path.join(ROOT, 'src', '_includes', 'components', 'post-card.njk');
let post = read(POST);
if (!post) console.log('   !   post-card.njk nahi mili.');
else if (post.includes('>Read more<')) console.log('   OK  matn pehle se "Read more" hai.');
else if (!post.includes('>Read guide<')) console.log('   !   button ka matn nahi pehchana.');
else {
  post = post.replace('>Read guide<', '>Read more<');
  writes.push({ file: POST, text: post, bak: true });
  console.log('   ->  "Read guide" se "Read more" (rang CSS mein theek ho raha hai).');
}

/* ======================================================= 3) faq ======== */

console.log('\n3) FAQ — Alpine se aazad');

const FAQ = path.join(ROOT, 'src', '_includes', 'components', 'faq-block.njk');
const faqOld = read(FAQ);
if (!faqOld) { console.log('XX  faq-block.njk nahi mili.'); process.exit(1); }

const FAQ_NEW = `{# FAQ. Pehle yeh poori tarah Alpine par chalta tha aur jawab x-cloak se
   chhupe hue the - Alpine na chale to jawab kabhi nazar hi nahi aate the.
   Ab browser ka apna <details> hai: bina JavaScript ke bhi khulta hai, aur
   Google jawab parh sakta hai. Pehla sawal khula rehta hai taake visitor ko
   foran pata chale ke yahan jawab milte hain. #}
{% if faqs and faqs.length %}
<section class="cv-auto mt-14 border-t border-slate-200 pt-10" aria-labelledby="faq-heading">
  <p class="eyebrow">Questions answered</p>
  <h2 id="faq-heading" class="mt-2 text-3xl font-black text-slate-950">Frequently asked questions</h2>
  <div class="bk-faq-list">
    {% for faq in faqs %}
    <details class="bk-faq-item"{% if loop.first %} open{% endif %}>
      <summary>
        <span>{{ faq.question }}</span>
        <span class="bk-faq-sign" aria-hidden="true"></span>
      </summary>
      <div class="bk-faq-answer">{{ faq.answer | safe }}</div>
    </details>
    {% endfor %}
  </div>
</section>
{% endif %}
`;

if (faqOld.includes('bk-faq-list')) console.log('   OK  pehle se theek hai.');
else if (!faqOld.includes('x-show="open===')) console.log('   !   purana Alpine wala dhaancha nahi pehchana — phir bhi badal raha hoon.');

if (!faqOld.includes('bk-faq-list')) {
  writes.push({ file: FAQ, text: FAQ_NEW, bak: true });
  console.log('   ->  <details> par aa jayega (bina JS ke bhi chalega).');
}

/* ======================================================= 4) CSS ======== */

console.log('\n4) input.css');

const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
const css = read(CSS);
if (!css) { console.log('XX  input.css nahi mili.'); process.exit(1); }

const MARK = '/* === Fix three (V11.20) === */';
if (css.includes(MARK)) console.log('   OK  pehle se laga hua hai.');
else {
  const BLOCK = `

${MARK}

/* ---- Guide card ka button -------------------------------------------
   .bk-card-actions > a:first-child (do class) .bk-book-button (ek class)
   par bhaari parta hai. Journey card par do link hote hain is liye pata
   nahi chalta; guide card par ek hi link hai, aur wahi button bhi hai —
   neeli likhai neele background par gayab ho jati thi. */
.bk-card-actions > a.bk-book-button,
.bk-card-actions > a.bk-book-button:hover {
  color: #ffffff;
}

/* ---- Affiliated with: logo ke neeche naam ---------------------------- */
.bk-affiliations-list li {
  display: grid;
  justify-items: center;
  width: 76px;
}
.bk-affiliations-list li > a {
  display: grid;
  justify-items: center;
  gap: 0.3rem;
}
.bk-affiliation-name {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 0.3rem;
  font-size: 0.625rem;
  line-height: 1.25;
  text-align: center;
  opacity: 0.85;
}

/* ---- FAQ (ab <details> par) ------------------------------------------ */
.bk-faq-list {
  display: grid;
  gap: 0.6rem;
  margin-top: 1.5rem;
}
.bk-faq-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}
.bk-faq-item > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
  cursor: pointer;
  color: #0f172a;
  font-weight: 700;
  list-style: none;
}
.bk-faq-item > summary::-webkit-details-marker { display: none; }
.bk-faq-item[open] > summary { color: #ff5a1f; }

.bk-faq-sign {
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;
}
.bk-faq-sign::before,
.bk-faq-sign::after {
  content: "";
  position: absolute;
  border-radius: 2px;
  background: #ff5a1f;
}
.bk-faq-sign::before { left: 0; top: 6px; width: 14px; height: 2px; }
.bk-faq-sign::after { left: 6px; top: 0; width: 2px; height: 14px; transition: transform 0.18s ease; }
.bk-faq-item[open] .bk-faq-sign::after { transform: scaleY(0); }

.bk-faq-answer {
  padding: 0 1.1rem 1.1rem;
  color: #475569;
  line-height: 1.75;
}

@media (prefers-reduced-motion: reduce) {
  .bk-faq-sign::after { transition: none; }
}
/* === Fix three END === */
`;
  writes.push({ file: CSS, text: css.trimEnd() + '\n' + BLOCK, bak: true });
  console.log('   ->  naya block aakhir mein juR jayega.');
}

/* ======================================================= write ========= */

console.log('\n--------------------------------------------------');

if (!writes.length) { console.log('Kuch badalne ko nahi hai.'); process.exit(0); }

if (!WRITE) {
  console.log(writes.length + ' file(s) badlengi. Save karne ke liye:');
  console.log('   node tools/fix-three.mjs --write');
  process.exit(0);
}

for (const w of writes) {
  if (w.bak && fs.existsSync(w.file) && !fs.existsSync(w.file + '.bak12')) fs.copyFileSync(w.file, w.file + '.bak12');
  fs.writeFileSync(w.file, w.text, 'utf8');
  console.log('LIKHA: ' + path.relative(ROOT, w.file).replace(/\\/g, '/'));
}
console.log('\nAgla qadam:  npm run build');
