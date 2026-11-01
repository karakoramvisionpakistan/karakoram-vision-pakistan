#!/usr/bin/env node
/**
 * fix-devcredit-design.mjs   (website ke folder mein)
 *
 * Developer credit ko "signature plate" bana deta hai (preview wala A):
 * goal ke andar </>, halka border, hover par orange aur zara ooper.
 *
 * Do cheezein:
 *   1. components/developer-credit.njk naye sire se likhi jati hai
 *   2. input.css mein V11.27 ka block jora jata hai
 *
 * Purani file ki backup banti hai. .bk-devcredit wali class waisi hi
 * rehti hai, is liye V11.26 ka centering aur dock ki jagah pehle ki
 * tarah kaam karte hain.
 *
 * Links ke teen haal:
 *   0 link  -> sirf dikhawa, click nahi hota
 *   1 link  -> poora plate ek link hai
 *   2+ link -> click par chhota menu khulta hai
 *
 * SAB KUCH YA KUCH BHI NAHI.
 *
 *   node tools/fix-devcredit-design.mjs            -> sirf dikhana
 *   node tools/fix-devcredit-design.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const NJK = path.join(ROOT, 'src', '_includes', 'components', 'developer-credit.njk');
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');

const problems = [];
const result = {};
const say = (s = '') => console.log(s);

/* ---------- 1. component ---------- */
/* "| length" Nunjucks ka apna filter hai aur har jagah chalta hai.
   selectattr jaisi cheez jaan bujh kar nahi istemal ki, kyunke build
   toot jane ka khatra mol lena theek nahi. */
const PLATE = `  <span class="bk-devcredit-glyph" aria-hidden="true">&lt;/&gt;</span>
  <span class="bk-devcredit-lines">
    {% if d.prefix %}<span class="bk-devcredit-pre">{{ d.prefix }}</span>{% endif %}
    <span class="bk-devcredit-name">{{ d.name }}</span>
    {% if d.role %}<span class="bk-devcredit-role">{{ d.role }}</span>{% endif %}
  </span>`;

const NJK_BODY = `{# Developer credit — "signature plate".
   Footer ki neechay wali patti mein beech mein baithta hai.
   .bk-devcredit wali class V11.26 ke centering ke liye zaroori hai.
   Andar ka design V11.27 mein hai. #}
{% set d = site.developer or {} %}
{% if d.show !== false and d.name %}
<div class="bk-devcredit">
{% if d.links and d.links | length > 1 %}
  {# ek se zyada link: click par menu #}
  <details class="bk-devcredit-menu">
    <summary class="bk-devcredit-plate" aria-label="{{ d.name }} — links">
${PLATE}
      <span class="bk-devcredit-caret" aria-hidden="true"></span>
    </summary>
    <div class="bk-devcredit-links">
      {% for l in d.links %}{% if l.url %}<a href="{{ l.url }}" target="_blank" rel="noopener">{{ l.label or l.url }}</a>{% endif %}{% endfor %}
    </div>
  </details>
{% elif d.links and d.links | length == 1 and d.links[0].url %}
  {# ek link: poora plate hi link hai #}
  <a class="bk-devcredit-plate" href="{{ d.links[0].url }}" target="_blank" rel="noopener">
${PLATE}
  </a>
{% else %}
  {# koi link nahi: sirf dikhawa #}
  <span class="bk-devcredit-plate bk-devcredit-plate--static">
${PLATE}
  </span>
{% endif %}
</div>
{% endif %}
`;

/* ---------- 2. CSS ---------- */
const MARK = '/* === Developer credit: signature plate (V11.27) === */';
const BLOCK = `

${MARK}
/* Rang site ke apne variable se liya jata hai agar mojood ho; warna
   aakhir mein likha hua orange chalta hai. Agar yeh orange site ke
   button se mel na khaye to sirf --bk-dev-accent ki qeemat badal dein,
   baqi kuch chhune ki zaroorat nahi. */

.bk-footer .bk-devcredit {
  --bk-dev-accent: var(--bk-accent, var(--accent, var(--brand, var(--color-accent, #f47421))));
  --bk-dev-soft: color-mix(in srgb, var(--bk-dev-accent) 16%, transparent);
  --bk-dev-line: rgba(255, 255, 255, 0.14);
}

.bk-footer .bk-devcredit-plate {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 1rem 0.5rem 0.75rem;
  border: 1px solid var(--bk-dev-line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.035);
  text-decoration: none;
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, transform .18s ease;
}

.bk-footer .bk-devcredit-plate:hover,
.bk-footer .bk-devcredit-menu[open] .bk-devcredit-plate {
  border-color: var(--bk-dev-accent);
  background: rgba(244, 116, 33, 0.16);   /* purane browser */
  background: var(--bk-dev-soft);
  transform: translateY(-1px);
}

.bk-footer .bk-devcredit-plate--static {
  cursor: default;
}

.bk-footer .bk-devcredit-glyph {
  flex: none;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--bk-dev-accent);
  background: rgba(244, 116, 33, 0.16);   /* purane browser */
  background: var(--bk-dev-soft);
}

.bk-footer .bk-devcredit-lines {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  text-align: left;
}

.bk-footer .bk-devcredit-pre {
  font-size: 0.68rem;
  opacity: 0.68;
}

.bk-footer .bk-devcredit-name {
  font-size: 0.86rem;
  font-weight: 600;
}

.bk-footer .bk-devcredit-role {
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.62;
}

/* ---- ek se zyada link: menu ---- */

.bk-footer .bk-devcredit-menu {
  position: relative;
  display: inline-block;
}

.bk-footer .bk-devcredit-menu > summary {
  list-style: none;
}

.bk-footer .bk-devcredit-menu > summary::-webkit-details-marker {
  display: none;
}

.bk-footer .bk-devcredit-caret {
  width: 0;
  height: 0;
  margin-left: 0.15rem;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  opacity: 0.55;
  transition: transform .18s ease;
}

.bk-footer .bk-devcredit-menu[open] .bk-devcredit-caret {
  transform: rotate(180deg);
}

.bk-footer .bk-devcredit-links {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.4rem;
  padding: 0.45rem;
  border: 1px solid var(--bk-dev-line);
  border-radius: 0.6rem;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  white-space: nowrap;
  z-index: 5;
}

.bk-footer .bk-devcredit-links a {
  font-size: 0.76rem;
  text-decoration: none;
  border: 1px solid var(--bk-dev-line);
  border-radius: 0.4rem;
  padding: 0.3rem 0.65rem;
  opacity: 0.8;
}

.bk-footer .bk-devcredit-links a:hover {
  opacity: 1;
  border-color: var(--bk-dev-accent);
}

.bk-footer .bk-devcredit-plate:focus-visible,
.bk-footer .bk-devcredit-links a:focus-visible {
  outline: 2px solid var(--bk-dev-accent);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .bk-footer .bk-devcredit-plate,
  .bk-footer .bk-devcredit-caret {
    transition: none;
  }
}
/* === V11.27 END === */
`;

/* ==================================================================== */

say('\nDEVELOPER CREDIT — SIGNATURE PLATE (A)');
say('='.repeat(78));
say('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

/* ---- njk ---- */
say('1. src/_includes/components/developer-credit.njk');
say('-'.repeat(78));
if (!fs.existsSync(NJK)) { say('   XX  file nahi mili'); problems.push('developer-credit.njk nahi mili'); }
else {
  const old = fs.readFileSync(NJK, 'utf8');
  if (old.includes('bk-devcredit-plate')) say('   -- naya design pehle se laga hua hai, chhora');
  else {
    const d = (NJK_BODY.match(/<(div|span|a|details|summary)\b/g) || []).length;
    const dc = (NJK_BODY.match(/<\/(div|span|a|details|summary)>/g) || []).length;
    const ifs = (NJK_BODY.match(/\{%-?\s*if\b/g) || []).length;
    const endifs = (NJK_BODY.match(/\{%-?\s*endif\s*-?%\}/g) || []).length;
    const fors = (NJK_BODY.match(/\{%-?\s*for\b/g) || []).length;
    const endfors = (NJK_BODY.match(/\{%-?\s*endfor\s*-?%\}/g) || []).length;

    if (d !== dc) { say('   XX  tags barabar nahi: ' + d + ' khule, ' + dc + ' band'); problems.push('njk tags'); }
    else if (ifs !== endifs) { say('   XX  if/endif barabar nahi: ' + ifs + '/' + endifs); problems.push('njk if'); }
    else if (fors !== endfors) { say('   XX  for/endfor barabar nahi: ' + fors + '/' + endfors); problems.push('njk for'); }
    else if (!NJK_BODY.includes('{{ d.name }}')) { say('   XX  naam hi nahi chhapta'); problems.push('njk name'); }
    else {
      say('   OK  purani file: ' + old.length + ' harf  ->  nayi: ' + NJK_BODY.length);
      say('       tags ' + d + '/' + dc + ', if ' + ifs + '/' + endifs + ', for ' + fors + '/' + endfors);
      say('       links: 0 -> sirf dikhawa, 1 -> poora plate link, 2+ -> menu');
      say('       class .bk-devcredit waisi hi hai (V11.26 ka centering bacha rahega)');
      result[NJK] = NJK_BODY;
    }
  }
}

/* ---- css ---- */
say('');
say('2. src/assets/css/input.css');
say('-'.repeat(78));
if (!fs.existsSync(CSS)) { say('   XX  file nahi mili'); problems.push('input.css nahi mili'); }
else {
  const t = fs.readFileSync(CSS, 'utf8');
  if (!t.includes('V11.26 END')) { say('   XX  V11.26 nahi mila — pehle fix-footer-bottom.mjs chalayein'); problems.push('V11.26 nahi'); }
  else if (t.includes(MARK) || t.includes('V11.27 END')) say('   -- V11.27 pehle se laga hua hai, chhora');
  else {
    const nt = t.replace(/\s*$/, '\n') + BLOCK;
    const ob = (nt.match(/\{/g) || []).length, cb = (nt.match(/\}/g) || []).length;
    if (ob !== cb) { say('   XX  braces barabar nahi: ' + ob + '/' + cb); problems.push('css braces'); }
    else {
      say('   OK  V11.27 jora ja raha hai (' + BLOCK.length + ' harf)');
      say('       braces ' + ob + '/' + cb);
      say('       rang: --bk-accent / --accent / --brand / --color-accent');
      say('             in mein se jo mile, warna #f47421');
      result[CSS] = nt;
    }
  }
}

/* ---- faisla ---- */
say('');
say('='.repeat(78));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) say('          ' + m);
  say('');
  say('   Yeh list mujhe bhej dein.');
  process.exit(1);
}
if (!Object.keys(result).length) { say('   Kuch badalna nahi tha — sab pehle se laga hua hai.'); process.exit(0); }
say('   Sab theek. Files badlengi: ' + Object.keys(result).length);
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-devcredit-design.mjs --write');
  process.exit(0);
}

for (const [f, text] of Object.entries(result)) {
  if (!fs.existsSync(f + '.bakdev27')) fs.copyFileSync(f, f + '.bakdev27');
  fs.writeFileSync(f, text, 'utf8');
  say('LIKHA: ' + path.relative(ROOT, f).split(path.sep).join('/'));
}
say('');
say('backup: *.bakdev27');
say('');
say('Agla qadam:  npm run build');
say('Phir footer ki neechay wali patti dekhein — beech mein plate hona chahiye.');
say('Hover kar ke bhi dekh lein.');
