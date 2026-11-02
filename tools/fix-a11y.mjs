#!/usr/bin/env node
/**
 * fix-a11y.mjs   (website ke folder mein)
 *
 * PageSpeed ki Accessibility wali ghaltiyon ka EK patch. Teen cheezein:
 *
 *   1. CONTRAST — narangi buttons par safaid matan ka ratio 3.12 hai,
 *      4.5 chahiye. Brand ka narangi (#ff5a1f) BILKUL waisa hi rehta hai;
 *      sirf matan gehra (#0f172a) hota hai -> 5.72. Hover par 6.53.
 *      CSS ka naya block V11.28 aakhir mein lag jata hai.
 *
 *   2. contact-modal.njk se `aria-hidden="true"` hatata hai. Us ke andar
 *      button aur links hain — PageSpeed isi ki shikayat kar raha hai.
 *      `hidden` attribute pehle se mojood hai, woh kaafi hai.
 *
 *   3. llms.txt.njk ke list items ko markdown link ki shakal deta hai
 *      (`- Tours: url` -> `- [Tours](url)`), jaisa llms.txt ka spec kehta hai.
 *
 * SAB YA KUCH BHI NAHI. Agar koi ek cheez na mili, kuch nahi likhta.
 * Backup: file ke sath .baka11y
 *
 *   node tools/fix-a11y.mjs            <- sirf dikhata hai
 *   node tools/fix-a11y.mjs --write    <- likhta hai
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

/* ---------- WCAG ---------- */
const srgb = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => { const l = [lum(a), lum(b)].sort((x, y) => y - x); return (l[0] + 0.05) / (l[1] + 0.05); };
const hex = (s) => { const t = s.replace('#', ''); const f = t.length === 3 ? t.split('').map((c) => c + c).join('') : t; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };

/* ---------- file padhna / likhna, CRLF ka khayal ---------- */
const files = new Map();   // rel -> { abs, orig, text, hadCRLF, changed }
const load = (rel) => {
  if (files.has(rel)) return files.get(rel);
  const abs = path.join(ROOT, rel.split('/').join(path.sep));
  if (!fs.existsSync(abs)) return null;
  const orig = fs.readFileSync(abs, 'utf8');
  const hadCRLF = orig.includes('\r\n');
  const f = { abs, orig, text: hadCRLF ? orig.replace(/\r\n/g, '\n') : orig, hadCRLF, changed: false };
  files.set(rel, f);
  return f;
};

const fails = [];
const steps = [];
const fail = (msg, detail) => { fails.push(msg); if (detail) fails.push('        ' + detail); };

say('');
say('ACCESSIBILITY PATCH' + (WRITE ? '   (LIKH RAHA HOON)' : '   (SIRF DIKHA RAHA HOON)'));
say('='.repeat(78));

/* ==================================================================== */
/* 1. CONTRAST                                                          */
/* ==================================================================== */
say('');
say('1. NARANGI BUTTONS KA MATAN — gehra kar rahe hain');
say('-'.repeat(78));

const CSSREL = 'src/assets/css/input.css';
const css = load(CSSREL);

const DARK = '#0f172a';
/* jin selectors ka background narangi hai */
const ACCENT_SELECTORS = [
  '.bk-plan-button',
  '.bk-mobile-plan',
  '.bk-mobile-toggle',
  '.bk-footer-top > a',
  '.bk-newsletter-form button',
  '.bk-footer-cta',
  '.bk-social-name',
];

if (!css) {
  fail('XX  ' + CSSREL + ' nahi mili');
} else {
  /* --bk-accent ki asli qeemat file se nikalo, andaze se nahi */
  const mA = css.text.match(/--bk-accent\s*:\s*([^;}]+)/);
  const mH = css.text.match(/--bk-accent-hover\s*:\s*([^;}]+)/);
  const accent = mA ? mA[1].trim() : null;
  const accentHover = mH ? mH[1].trim() : null;

  if (!accent) fail('XX  --bk-accent CSS mein nahi mila');
  else {
    say('   --bk-accent        ' + accent);
    say('   --bk-accent-hover  ' + (accentHover || '(nahi mila)'));
    say('');
    let allOk = true;
    for (const [bg, label] of [[accent, 'aam halat'], [accentHover, 'hover    ']]) {
      if (!bg || !/^#[0-9a-fA-F]{3,6}$/.test(bg)) continue;
      const rNew = ratio(hex(DARK), hex(bg));
      const rOld = ratio(hex('#ffffff'), hex(bg));
      if (rNew < 4.5) allOk = false;
      say('   ' + label + '   safaid ' + rOld.toFixed(2) + (rOld >= 4.5 ? ' OK' : ' XX')
                  + '   ->   gehra ' + rNew.toFixed(2) + (rNew >= 4.5 ? ' OK' : ' XX'));
    }
    if (!allOk) fail('XX  gehra matan bhi 4.5 tak nahi pohnchta — rang badal gaya hai, patch rok diya');
  }

  /* kaun kaun sa selector CSS mein waqai mojood hai */
  say('');
  const present = [];
  for (const sel of ACCENT_SELECTORS) {
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/>/g, '>').replace(/\\s/g, '\\s');
    const re = new RegExp(esc.replace(/\s+/g, '\\s*'));
    if (re.test(css.text)) { present.push(sel); say('   OK  ' + sel); }
    else say('   --  ' + sel + '   (CSS mein nahi — chhor diya)');
  }
  if (present.length < 4) fail('XX  ' + present.length + ' hi selector mile, 4 se kam — kuch badal gaya hai');

  /* aakhri version block ka marker */
  const markers = [...css.text.matchAll(/===\s*(V[\d.]+)\s*END\s*===/g)].map((m) => m[1]);
  const last = markers.length ? markers[markers.length - 1] : null;
  say('');
  say('   CSS ka aakhri block: ' + (last || '(koi marker nahi)'));
  if (css.text.includes('=== V11.28')) fail('XX  V11.28 pehle se mojood hai — patch dobara nahi lagta');

  if (!fails.length) {
    const selBlock = [];
    for (const sel of present) {
      selBlock.push(sel + ',');
      /* hover ke apne rules hain jo safaid matan dobara lagate hain */
      if (sel !== '.bk-social-name') selBlock.push(sel + ':hover,');
      if (sel !== '.bk-social-name') selBlock.push(sel + ':focus-visible,');
    }
    const lastSel = selBlock.pop().replace(/,$/, '');
    const block = [
      '/* === V11.28 START === */',
      '/* Narangi par safaid matan ka contrast 3.12 tha, WCAG 4.5 maangta hai.',
      '   Brand ka narangi waisa hi hai; sirf matan gehra kiya hai:',
      '     ' + accent + ' par ' + DARK + '  ->  ' + ratio(hex(DARK), hex(accent)).toFixed(2),
      ...(accentHover ? ['     ' + accentHover + ' par ' + DARK + '  ->  ' + ratio(hex(DARK), hex(accentHover)).toFixed(2)] : []),
      '   Yeh block sab se aakhir mein hai, is liye upar wale rules par ghalib hai. */',
      ...selBlock,
      lastSel + ' {',
      '  color: ' + DARK + ';',
      '}',
      '/* === V11.28 END === */',
    ].join('\n');

    css.text = css.text.replace(/\s*$/, '\n') + '\n' + block + '\n';
    css.changed = true;
    steps.push(CSSREL + '  —  V11.28 block laga (' + present.length + ' selector, matan ' + DARK + ')');
  }
}

/* ==================================================================== */
/* 2. contact-modal ka aria-hidden                                      */
/* ==================================================================== */
say('');
say('2. contact-modal.njk — aria-hidden="true" hata rahe hain');
say('-'.repeat(78));

const MODALREL = 'src/_includes/components/contact-modal.njk';
const modal = load(MODALREL);

if (!modal) {
  fail('XX  ' + MODALREL + ' nahi mili');
} else {
  /* woh khulne wala tag dhoondo jis par data-contact-modal aur aria-hidden dono hon */
  const tagRe = /<div([^>]*\bdata-contact-modal\b[^>]*)>/;
  const m = modal.text.match(tagRe);
  if (!m) fail('XX  data-contact-modal wala tag nahi mila');
  else {
    const attrs = m[1];
    say('   mila: <div' + attrs.slice(0, 110).replace(/\s+/g, ' ') + ' ...>');
    if (!/\baria-hidden\s*=\s*["']true["']/.test(attrs)) {
      say('   --  aria-hidden="true" pehle se nahi hai — kuch karne ki zaroorat nahi');
    } else if (!/\bhidden\b(?!\s*=)/.test(attrs) && !/\bhidden\s*=/.test(attrs)) {
      fail('XX  `hidden` attribute nahi hai — sirf aria-hidden hata dena ghalat hoga');
    } else {
      const fixedAttrs = attrs.replace(/\s*\baria-hidden\s*=\s*["']true["']/, '');
      modal.text = modal.text.replace(m[0], '<div' + fixedAttrs + '>');
      modal.changed = true;
      say('   OK  `hidden`, role="dialog", aria-modal, aria-labelledby — sab reh rahe hain');
      steps.push(MODALREL + '  —  aria-hidden="true" hata (hidden attribute kaam karta rahega)');
    }
  }

  /* khabardari: kya JS is modal par aria-hidden ko chhoota hai? */
  const jsHits = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.') || /\.bak/.test(e.name)) continue;
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(js|njk|html)$/.test(e.name)) {
        let t; try { t = fs.readFileSync(f, 'utf8'); } catch { return; }
        if (!/aria-hidden/.test(t)) return;
        t.split(/\r?\n/).forEach((l, i) => {
          if (/aria-hidden/.test(l) && /(contact|modal|setAttribute|removeAttribute)/i.test(l)) {
            jsHits.push(path.relative(ROOT, f).split(path.sep).join('/') + ':' + (i + 1) + '  ' + l.trim().slice(0, 95));
          }
        });
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  if (jsHits.length) {
    say('');
    say('   Khabardari — aria-hidden kahan kahan chhua jata hai:');
    for (const h of jsHits.slice(0, 8)) say('      ' + h);
    if (jsHits.length > 8) say('      ... aur ' + (jsHits.length - 8));
  }
}

/* ==================================================================== */
/* 3. llms.txt ki shakal                                                */
/* ==================================================================== */
say('');
say('3. llms.txt.njk — list ko markdown link bana rahe hain');
say('-'.repeat(78));

const LLMSREL = 'src/llms.txt.njk';
const llms = load(LLMSREL);

if (!llms) {
  fail('XX  ' + LLMSREL + ' nahi mili');
} else {
  const lines = llms.text.split('\n');
  let inSection = false;
  let n = 0;
  const changed = lines.map((l) => {
    if (/^##\s/.test(l)) { inSection = true; return l; }
    if (/^#\s/.test(l)) { inSection = false; return l; }
    if (!inSection) return l;
    /* `- Naam: <url ya template>`  ->  `- [Naam](<url>)` */
    const m = l.match(/^(\s*)-\s+([^:[\]]+?)\s*:\s*(\{\{[^}]*\}\}\S*|https?:\/\/\S+|\/\S+)\s*$/);
    if (!m) return l;
    n++;
    return m[1] + '- [' + m[2].trim() + '](' + m[3].trim() + ')';
  });

  if (!n) {
    say('   --  badalne wali koi line nahi mili (shayad pehle se theek hai)');
  } else {
    say('   ' + n + ' line markdown link ban gayi. Misal:');
    let shown = 0;
    for (let i = 0; i < lines.length && shown < 4; i++) {
      if (lines[i] !== changed[i]) { say('      purana: ' + lines[i].trim()); say('      naya  : ' + changed[i].trim()); say(''); shown++; }
    }
    llms.text = changed.join('\n');
    llms.changed = true;
    steps.push(LLMSREL + '  —  ' + n + ' list item markdown link bane');
  }
}

/* ==================================================================== */
/* JAANCH                                                               */
/* ==================================================================== */
say('');
say('JAANCH');
say('-'.repeat(78));

const check = (ok, label) => { say('   ' + (ok ? 'OK  ' : 'XX  ') + label); if (!ok) fail('XX  jaanch nakaam: ' + label); };

if (css && css.changed) {
  const open = (css.text.match(/\{/g) || []).length;
  const close = (css.text.match(/\}/g) || []).length;
  check(open === close, 'CSS ke bracket barabar hain  (' + open + ' { / ' + close + ' })');
  check(css.text.includes('=== V11.28 START ===') && css.text.includes('=== V11.28 END ==='), 'V11.28 ke dono marker mojood');
  check(css.text.includes('color: ' + DARK), 'gehra rang likha gaya');
  /* muqabla NORMALIZE kiye hue purane matan se — warna CRLF wali file par
     har line ka \r ginti bigaar deta hai */
  const origLF = css.orig.replace(/\r\n/g, '\n');
  check(css.text.length > origLF.length, 'CSS bari hui, choti nahi  (+' + (css.text.length - origLF.length) + ' harf)');
  check(css.text.includes('--bk-accent:'), '--bk-accent waisa hi hai (brand ka rang nahi badla)');
  check(/===\s*V11\.28\s*END\s*===\s*\*\/\s*$/.test(css.text), 'V11.28 file ke sab se aakhir mein hai (is liye ghalib rahega)');
  check(css.text.startsWith(css.orig.replace(/\r\n/g, '\n').replace(/\s*$/, '')), 'purana CSS chhua nahi gaya, sirf aakhir mein jora gaya');
}
if (modal && modal.changed) {
  check(!/aria-hidden\s*=\s*["']true["'][^>]*data-contact-modal/.test(modal.text)
     && !/data-contact-modal[^>]*aria-hidden\s*=\s*["']true["']/.test(modal.text), 'modal par aria-hidden="true" nahi raha');
  for (const must of ['data-contact-modal', 'role="dialog"', 'aria-modal="true"', 'aria-labelledby=', 'id="contact-modal"']) {
    check(modal.text.includes(must), 'bacha hua: ' + must);
  }
  check(/<div[^>]*\bdata-contact-modal\b[^>]*\bhidden\b/.test(modal.text), 'bacha hua: hidden attribute');
  check(modal.text.split('\n').length === modal.orig.replace(/\r\n/g, '\n').split('\n').length, 'lines ki ginti waisi hi hai');
}
if (llms && llms.changed) {
  const badLeft = llms.text.split('\n').filter((l) => /^\s*-\s+[^[]+:\s*(\{\{|https?:|\/)/.test(l));
  check(badLeft.length === 0, 'koi purani shakal ki list line nahi bachi' + (badLeft.length ? '  (' + badLeft.length + ' bachi)' : ''));
  check(/^- \[/m.test(llms.text), 'markdown link ki shakal mil gayi');
  check(llms.text.split('\n').length === llms.orig.replace(/\r\n/g, '\n').split('\n').length, 'lines ki ginti waisi hi hai');
  const tpl = (llms.orig.match(/\{\{/g) || []).length;
  check((llms.text.match(/\{\{/g) || []).length === tpl, 'Nunjucks ke {{ }} poore hain  (' + tpl + ')');
}

/* ==================================================================== */
/* NATEEJA                                                              */
/* ==================================================================== */
say('');
say('='.repeat(78));

if (fails.length) {
  say('');
  say('   RUK GAYA — KUCH BHI NAHI BADLA');
  say('');
  for (const f of fails) say('   ' + f);
  say('');
  say('   Yeh matan mujhe bhej dein.');
  say('');
  fs.writeFileSync(path.join(ROOT, '_a11yfix.txt'), out.join('\n') + '\n', 'utf8');
  console.log('-'.repeat(78));
  console.log('LIKHA: _a11yfix.txt');
  process.exit(1);
}

say('');
say('   JO HOGA:');
for (const s of steps) say('      ' + s);

const toWrite = [...files.entries()].filter(([, f]) => f.changed);

if (!WRITE) {
  say('');
  say('   Sab jaanch saaf. Abhi kuch likha NAHI.');
  say('   Lagane ke liye:   node tools/fix-a11y.mjs --write');
  say('');
} else {
  say('');
  for (const [rel, f] of toWrite) {
    fs.copyFileSync(f.abs, f.abs + '.baka11y');
    fs.writeFileSync(f.abs, f.hadCRLF ? f.text.replace(/\n/g, '\r\n') : f.text, 'utf8');
    say('   LIKHA: ' + rel + '   (backup: ' + path.basename(f.abs) + '.baka11y)');
  }
  say('');
  say('   Ab:   npm run build');
  say('');
}

fs.writeFileSync(path.join(ROOT, '_a11yfix.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _a11yfix.txt');
