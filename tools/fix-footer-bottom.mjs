#!/usr/bin/env node
/**
 * fix-footer-bottom.mjs   (website ke folder mein)
 *
 * Teen cheezein. SAB KUCH YA KUCH BHI NAHI.
 *
 *  1. Neechay wali patti mein tarteeb badli: ab copyright baayein, aap ka
 *     naam BEECH mein, aur Terms/Privacy/... daayein.
 *
 *  2. Dock se takrao khatam. Neechay daayein taairta hua contact dock
 *     (WhatsApp, chat) is patti ke ooper aa jata tha jab safha aakhir tak
 *     scroll ho. Ab us ke liye jagah chhor di gayi hai. (Yeh wahi CSS hai
 *     jo fix-footer-dock-clash.mjs mein thi — woh alag se chalane ki ab
 *     zaroorat nahi.)
 *
 *  3. site.json mein founded_year 2007 se 2005 — aap ne tasdeeq ki ke
 *     2005 sahi hai. Credentials pehle se 2005 kehti thi, to ab dono ek
 *     baat kehte hain. Yeh structured data mein bhi jata hai.
 *
 *   node tools/fix-footer-bottom.mjs            -> sirf dikhana
 *   node tools/fix-footer-bottom.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FOOTER = path.join(ROOT, 'src', '_includes', 'components', 'footer.njk');
const CSS = path.join(ROOT, 'src', 'assets', 'css', 'input.css');
const SITE = path.join(ROOT, 'src', '_data', 'site.json');

const problems = [];
const result = {};
const say = (s = '') => console.log(s);

/* ---- 1. tarteeb ---- */

const NAV = `    <nav aria-label="Footer navigation">{% for link in f.bottom.links %}{% if link.enabled !== false %}<a href="{{ link.url }}"{% if link.target_blank %} target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a>{% endif %}{% endfor %}</nav>`;
const DEVINC = `    {% include "components/developer-credit.njk" %}`;

const OLD = NAV + '\n' + DEVINC;
const NEW = DEVINC + '\n' + NAV;

/* ---- 2 + 3. CSS ---- */

const MARK = '/* === Footer bottom: name centred, dock cleared (V11.26) === */';
const BLOCK = `

${MARK}
/* Patti mein teen cheezein hain: copyright, naam, qanooni links.
   justify-between un ko dono kinaron aur beech mein rakhta hai; naam ko
   flex:1 de kar beech mein jamaya gaya hai.

   Saath hi contact dock (.bk-contact-dock) ke liye jagah. Woh fixed hai
   aur neechay daayein rehta hai, to safha aakhir tak scroll hone par is
   patti ke ooper aa jata tha. Naap golon se thora zyada rakha hai taake
   hover par bare hone par bhi na takraye. */

.bk-footer-bottom {
  padding-bottom: 5.5rem;
}

.bk-footer .bk-devcredit {
  flex: 1 1 auto;
  text-align: center !important;
}

@media (min-width: 768px) {
  .bk-footer-bottom {
    padding-right: 6.5rem;
    padding-bottom: 1rem;
  }
}
/* === V11.26 END === */
`;

/* ==================================================================== */

say('\nFOOTER KI NEECHAY WALI PATTI');
say('='.repeat(78));
say('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

/* ---- footer.njk ---- */
say('1. src/_includes/components/footer.njk  — tarteeb');
say('-'.repeat(78));
if (!fs.existsSync(FOOTER)) { say('   XX  file nahi mili'); problems.push('footer.njk'); }
else {
  const t = fs.readFileSync(FOOTER, 'utf8');
  if (t.includes(NEW)) say('   -- tarteeb pehle se theek hai, chhora');
  else {
    const n = t.split(OLD).length - 1;
    if (n !== 1) { say('   XX  tarteeb ka hissa ' + n + ' jagah mila, ek chahiye'); problems.push('footer: order'); }
    else {
      const nt = t.split(OLD).join(NEW);
      const d = (nt.match(/<div\b/g) || []).length, dc = (nt.match(/<\/div>/g) || []).length;
      const ifs = (nt.match(/\{%-?\s*if\b/g) || []).length, endifs = (nt.match(/\{%-?\s*endif\s*-?%\}/g) || []).length;
      if (d !== dc || ifs !== endifs) { say('   XX  tags barabar nahi (div ' + d + '/' + dc + ', if ' + ifs + '/' + endifs + ')'); problems.push('footer: tags'); }
      else {
        say('   OK  pehle:  copyright  |  Terms Privacy ...  |  naam');
        say('       ab:     copyright  |  naam  |  Terms Privacy ...');
        say('       jaanch: div aur if barabar');
        result[FOOTER] = nt;
      }
    }
  }
}

/* ---- CSS ---- */
say('');
say('2. src/assets/css/input.css  — beech mein, aur dock se jagah');
say('-'.repeat(78));
if (!fs.existsSync(CSS)) { say('   XX  file nahi mili'); problems.push('input.css'); }
else {
  const t = fs.readFileSync(CSS, 'utf8');
  if (!t.includes('V11.25 END')) { say('   XX  V11.25 nahi mila — pehle fix-footer-layout.mjs chalayein'); problems.push('V11.25 nahi'); }
  else if (t.includes(MARK) || t.includes('V11.26 END')) say('   -- V11.26 pehle se laga hua hai, chhora');
  else {
    const nt = t.replace(/\s*$/, '\n') + BLOCK;
    const ob = (nt.match(/\{/g) || []).length, cb = (nt.match(/\}/g) || []).length;
    if (ob !== cb) { say('   XX  braces barabar nahi: ' + ob + '/' + cb); problems.push('css braces'); }
    else {
      say('   OK  naam beech mein (flex:1 + text-align:center)');
      say('   OK  chhoti screen: neechay 5.5rem jagah');
      say('   OK  bari screen:   daayein 6.5rem jagah');
      say('       braces ' + ob + '/' + cb);
      result[CSS] = nt;
    }
  }
}

/* ---- site.json ---- */
say('');
say('3. src/_data/site.json  — founded_year');
say('-'.repeat(78));
if (!fs.existsSync(SITE)) { say('   XX  file nahi mili'); problems.push('site.json'); }
else {
  let d;
  try { d = JSON.parse(fs.readFileSync(SITE, 'utf8')); }
  catch (e) { say('   XX  JSON parh nahi saki: ' + e.message); problems.push('site.json parse'); d = null; }
  if (d) {
    const cur = (d.business || {}).founded_year;
    if (cur === '2005') say('   -- pehle se 2005 hai, chhora');
    else {
      say('   OK  founded_year: ' + (cur || '[khaali]') + '  ->  2005');
      say('       credentials bhi 2005 kehti hai, ab dono ek baat kehte hain');
      d.business = d.business || {};
      d.business.founded_year = '2005';
      result[SITE] = JSON.stringify(d, null, 2) + '\n';
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
  say('   Yeh list mujhe bhej dein, badal dunga.');
  process.exit(1);
}
if (!Object.keys(result).length) { say('   Kuch badalna nahi tha — sab pehle se laga hua hai.'); process.exit(0); }
say('   Sab theek. Files badlengi: ' + Object.keys(result).length);
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-footer-bottom.mjs --write');
  process.exit(0);
}

for (const [f, text] of Object.entries(result)) {
  if (!fs.existsSync(f + '.bakbottom')) fs.copyFileSync(f, f + '.bakbottom');
  fs.writeFileSync(f, text, 'utf8');
  say('LIKHA: ' + path.relative(ROOT, f).split(path.sep).join('/'));
}
say('');
say(Object.keys(result).length + ' files. backup: *.bakbottom');
say('');
say('Agla qadam:  npm run build');
