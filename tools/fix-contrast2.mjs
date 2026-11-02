#!/usr/bin/env node
/**
 * fix-contrast2.mjs   (website ke folder mein)
 *
 * Contrast ka doosra aur aakhri hissa. Yeh andaze par nahi — browser mein
 * canvas se naape hue asli rangon par bana hai:
 *
 *   .bk-home-contact .eyebrow      2.95 -> 6.46   (blue-700 tqrbn siyah par)
 *   .bk-footer-rating-links small  4.40 -> 5.49   (#94a3b8 neele panel par)
 *   .bk-footer dt                  4.03 -> 8.57   (opacity 0.6 hatai)
 *   .bk-devcredit-role             4.14 -> 8.26   (opacity 0.62 hatai)
 *   .bk-footer-cta                 2.59 -> 6.37   (V11.28 yahan haar gaya tha)
 *
 * V11.28 is liye haara ke us ki taqat (specificity) kam thi. Is baar har
 * selector ki class do-teen baar likhi hai — yeh CSS ka maana hua tareeqa
 * hai: matlab wahi rehta hai, taqat barh jati hai.
 *
 * Likhne se pehle yeh HAR target ke muqable wale rules dhoondta hai aur
 * un ki taqat ginta hai. Agar koi rule hamare se taqatwar nikle, ya kahin
 * !important ho, to RUK JATA HAI — kyunki phir yeh patch bhi haar jayega.
 *
 * SAB YA KUCH BHI NAHI. Backup: .bakcon2
 *
 *   node tools/fix-contrast2.mjs            <- sirf dikhata hai
 *   node tools/fix-contrast2.mjs --write    <- likhta hai
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const fail = (m, d) => { fails.push(m); if (d) fails.push('        ' + d); };

/* ---------- WCAG ---------- */
const sg = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * sg(r) + 0.7152 * sg(g) + 0.0722 * sg(b);
const ratio = (a, b) => { const l = [lum(a), lum(b)].sort((x, y) => y - x); return (l[0] + 0.05) / (l[1] + 0.05); };
const hx = (h) => { const t = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(t.slice(i, i + 2), 16)); };

/* ---------- browser se naapa hua — yahi sach hai ---------- */
const TARGETS = [
  {
    name: '.bk-home-contact .eyebrow',
    cls: 'eyebrow',
    sel: '.bk-home-contact .eyebrow.eyebrow',          /* 0,3,0 */
    decl: 'color: #ff5a1f;',
    was: 2.95, fg: '#ff5a1f', bg: [2, 6, 24], px: 12.0, weight: 900,
    why: 'Tailwind ka blue-700 tqrbn siyah background par',
  },
  {
    name: '.bk-footer-rating-links small',
    cls: 'bk-footer-rating-links',
    sel: '.bk-footer-rating-links.bk-footer-rating-links small',   /* 0,2,1 */
    decl: 'color: #a8b6c9;',
    was: 4.40, fg: '#a8b6c9', bg: [21, 55, 122], px: 10.4, weight: 400,
    why: '#94a3b8 neele panel par — baal baal reh gaya tha',
  },
  {
    name: '.bk-footer dt',
    cls: 'bk-footer',
    sel: '.bk-footer.bk-footer dt',                     /* 0,2,1 */
    decl: 'opacity: 1;',
    was: 4.03, after: 8.57,
    why: 'rang theek hai, opacity 0.6 ne dhundla kiya tha',
  },
  {
    name: '.bk-devcredit-role',
    cls: 'bk-devcredit-role',
    sel: '.bk-devcredit-role.bk-devcredit-role.bk-devcredit-role', /* 0,3,0 */
    decl: 'opacity: 1;',
    was: 4.14, after: 8.26,
    why: 'rang theek hai, opacity 0.62 ne dhundla kiya tha',
  },
  {
    name: '.bk-footer-cta',
    cls: 'bk-footer-cta',
    sel: '.bk-footer-cta.bk-footer-cta.bk-footer-cta',  /* 0,3,0 */
    decl: 'color: #0f172a;',
    hover: true,
    was: 2.59, fg: '#0f172a', bg: [249, 115, 22], px: 14.0, weight: 600,
    why: 'V11.28 ki taqat kam thi, haar gaya',
  },
];

/* ---------- taqat ka hisaab ---------- */
const specOf = (selector) => {
  const a = (selector.match(/#[\w-]+/g) || []).length;
  const b = (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
  return { a, b, str: '0,' + b + ',x' };
};
const stronger = (x, y) => (x.a !== y.a ? x.a > y.a : x.b > y.b);

say('');
say('CONTRAST PATCH — DOOSRA HISSA' + (WRITE ? '   (LIKH RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

const CSSREL = 'src/assets/css/input.css';
const abs = path.join(ROOT, CSSREL.split('/').join(path.sep));
if (!fs.existsSync(abs)) { console.log('XX  ' + CSSREL + ' nahi mili'); process.exit(1); }
const orig = fs.readFileSync(abs, 'utf8');
const hadCRLF = orig.includes('\r\n');
const origLF = hadCRLF ? orig.replace(/\r\n/g, '\n') : orig;
let text = origLF;

if (/===\s*V11\.29\s*/.test(text)) fail('XX  V11.29 pehle se mojood hai — patch dobara nahi lagta');
if (!/===\s*V11\.28\s*END\s*===/.test(text)) fail('XX  V11.28 ka marker nahi mila — pehla patch laga hi nahi?');

/* ---------- hisaab ki tasdeeq ---------- */
say('');
say('1. HISAAB — browser ke naape hue rangon par');
say('-'.repeat(78));
for (const t of TARGETS) {
  if (t.fg) {
    const r = ratio(hx(t.fg), t.bg);
    const need = (t.px >= 24 || (t.px >= 18.66 && t.weight >= 700)) ? 3 : 4.5;
    const ok = r >= need;
    say('   ' + t.name.padEnd(32) + t.was.toFixed(2) + '  ->  ' + r.toFixed(2) + '   (chahiye ' + need + ')   ' + (ok ? 'OK' : 'XX'));
    if (!ok) fail('XX  ' + t.name + ' ka naya rang bhi ' + need + ' tak nahi pohnchta (' + r.toFixed(2) + ')');
    t.after = +r.toFixed(2);
  } else {
    say('   ' + t.name.padEnd(32) + t.was.toFixed(2) + '  ->  ' + t.after.toFixed(2) + '   (opacity hatane se)   OK');
  }
  say('      ' + t.why);
}

/* ---------- muqable wale rules ---------- */
say('');
say('2. MUQABLA — in classes par aur kaun se rules hain');
say('-'.repeat(78));

const lines = text.split('\n');
for (const t of TARGETS) {
  const prop = t.decl.split(':')[0].trim();
  const re = new RegExp('\\.' + t.cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])');
  const rivals = [];
  for (let i = 0; i < lines.length; i++) {
    if (!re.test(lines[i])) continue;
    /* selector list = is line ka { se pehle ka hissa (ya agli line ka) */
    let selPart = lines[i], j = i;
    while (!selPart.includes('{') && j + 1 < lines.length && j - i < 4) { j++; selPart += ' ' + lines[j]; }
    if (!selPart.includes('{')) continue;
    const selector = selPart.split('{')[0];
    if (!re.test(selector)) continue;
    /* block ka matan */
    let body = '', depth = 0;
    for (let k = j; k < lines.length && k - j < 30; k++) {
      body += lines[k] + '\n';
      depth += (lines[k].match(/\{/g) || []).length - (lines[k].match(/\}/g) || []).length;
      if (depth <= 0 && k > j - 1) break;
    }
    const touches = new RegExp('(^|[;{\\s])' + prop + '\\s*:').test(body);
    if (!touches) continue;
    /* sirf woh compound jis mein hamari class hai */
    const comp = selector.split(',').find((c) => re.test(c)) || selector;
    rivals.push({ line: i + 1, comp: comp.trim().slice(0, 64), spec: specOf(comp), bang: /!important/.test(body) });
  }

  const mine = specOf(t.sel.split(',')[0]);
  say('');
  say('   ' + t.name + '   (' + prop + ')');
  say('      hamara rule:  ' + t.sel.slice(0, 64));
  say('      hamari taqat: ' + mine.b + ' class');
  if (!rivals.length) say('      muqabla: koi nahi mila');
  for (const r of rivals) {
    const bad = !stronger(mine, r.spec) && !(mine.b === r.spec.b);
    say('      line ' + String(r.line).padStart(5) + '  ' + String(r.spec.b) + ' class  ' + r.comp + (r.bang ? '   !important' : '') + (bad ? '   <- yeh hamein haraye ga' : ''));
    if (r.bang) fail('XX  ' + t.name + ' par line ' + r.line + ' mein !important hai — yeh patch us se nahi jeet sakta', r.comp);
    if (r.spec.b > mine.b) fail('XX  ' + t.name + ' par line ' + r.line + ' ka rule hamare se taqatwar hai (' + r.spec.b + ' vs ' + mine.b + ')', r.comp);
  }
}

/* ---------- block banao ---------- */
if (!fails.length) {
  const body = [];
  body.push('/* === V11.29 START === */');
  body.push('/* Contrast ka doosra hissa. Rang browser mein canvas se naape gaye hain,');
  body.push('   CSS parh kar andaza nahi lagaya — pehli baar yahi ghalti hui thi.');
  body.push('   Har class jaan boojh kar do-teen baar likhi hai: matlab wahi rehta');
  body.push('   hai, bas taqat barh jati hai, kyunki V11.28 taqat kam hone se haar');
  body.push('   gaya tha. */');
  for (const t of TARGETS) {
    body.push('');
    body.push('/* ' + t.name + ':  ' + t.was.toFixed(2) + ' -> ' + t.after.toFixed(2) + '   (' + t.why + ') */');
    const sels = [t.sel];
    if (t.hover) { sels.push(t.sel + ':hover'); sels.push(t.sel + ':focus-visible'); }
    body.push(sels.join(',\n') + ' {');
    body.push('  ' + t.decl);
    body.push('}');
  }
  body.push('/* === V11.29 END === */');
  text = text.replace(/\s*$/, '\n') + '\n' + body.join('\n') + '\n';
}

/* ---------- jaanch ---------- */
say('');
say('JAANCH');
say('-'.repeat(78));
const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fail('XX  jaanch nakaam: ' + label); };
if (!fails.length) {
  const o = (text.match(/\{/g) || []).length, c = (text.match(/\}/g) || []).length;
  check(o === c, 'bracket barabar hain  (' + o + ' { / ' + c + ' })');
  check(/===\s*V11\.29\s*END\s*===\s*\*\/\s*$/.test(text), 'V11.29 file ke sab se aakhir mein hai');
  check(text.startsWith(origLF.replace(/\s*$/, '')), 'purana CSS chhua nahi gaya, sirf aakhir mein jora gaya');
  check(text.length > origLF.length, 'file bari hui  (+' + (text.length - origLF.length) + ' harf)');
  check(/--bk-accent:/.test(text), 'brand ke rang ki tareef waisi hi hai');
  for (const t of TARGETS) check(text.includes(t.sel + ' {') || text.includes(t.sel + ','), 'block mein mojood: ' + t.name);
  check(!/!important/.test(text.slice(origLF.length)), 'naye block mein koi !important nahi');
}

/* ---------- nateeja ---------- */
say('');
say('='.repeat(78));
if (fails.length) {
  say('');
  say('   RUK GAYA — KUCH BHI NAHI BADLA');
  say('');
  for (const f of fails) say('   ' + f);
  say('');
  fs.writeFileSync(path.join(ROOT, '_contrast2.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: _contrast2.txt');
  process.exit(1);
}

say('');
say('   JO HOGA:  ' + CSSREL + '  —  V11.29 block, ' + TARGETS.length + ' selector');
say('');
say('   DEKHNE MEIN KYA BADLEGA:');
say('      - "START A CONVERSATION" neele se narangi ho jayega');
say('      - footer ke "Google reviews" / "Traveller reviews" halke roshan');
say('      - "GOVERNMENT LICENCE", "MEMBER OF", "REGISTERED WITH" aur');
say('        "SOFTWARE DEVELOPER" ab dhundle nahi, poore roshan');
say('      - "Subscribe by email" ka matan safaid se gehra');
if (!WRITE) {
  say('');
  say('   Abhi kuch likha NAHI.');
  say('   Lagane ke liye:   node tools/fix-contrast2.mjs --write');
  say('');
} else {
  fs.copyFileSync(abs, abs + '.bakcon2');
  fs.writeFileSync(abs, hadCRLF ? text.replace(/\n/g, '\r\n') : text, 'utf8');
  say('');
  say('   LIKHA: ' + CSSREL + '   (backup: input.css.bakcon2)');
  say('');
  say('   Ab:   npm run build');
  say('');
}
fs.writeFileSync(path.join(ROOT, '_contrast2.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _contrast2.txt');
