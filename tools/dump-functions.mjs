#!/usr/bin/env node
/**
 * dump-functions.mjs   (website ke folder mein)
 *
 * Form ka raasta samajhne ke liye functions/ ki chand files ka matan
 * nikalti hai — MAGAR CHAABI JAISI HAR CHEEZ CHHUPA KAR.
 *
 * Mask kya hota hai:
 *   - koi bhi quoted string jo lambi aur be-tarteeb ho (token/key jaisi)
 *   - us line ki har quoted qeemat jis mein pass/secret/token/key/auth/
 *     bearer/credential likha ho
 *   - URL ke andar ke query token
 *
 * Mask kya NAHI hota (kyunke yeh logic samajhne ke liye zaroori hai):
 *   - raaste jaise /api/trip-request
 *   - domain aur URL ka pata (query ke bagair)
 *   - email ke pate
 *   - chhoti aur saada strings
 *
 * Har mask shuda jagah par "[chhupaya: N harf]" likha hota hai, taake
 * aap ko pata rahe ke wahan kuch tha.
 *
 * Phir bhi: bhejne se pehle khud ek nazar daal lein. Masking achhi hai,
 * kaamil nahi.
 *
 *   node tools/dump-functions.mjs
 *   node tools/dump-functions.mjs functions/api/reviews.js
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const DEFAULTS = [
  'functions/api/trip-request.js',
  'functions/_lib/smtp.js',
  'functions/_middleware.js',
];
const targets = args.length ? args : DEFAULTS;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

/* ---- masking ---- */
const SENSITIVE_LINE = /(pass|passwd|secret|token|key|auth|bearer|credential|signature|hmac)/i;

/* Sensitive line par sirf yeh shaklein bachti hain. Pehle yahan ek
   "aam jumla" wala narm rule tha jo taqreeban har alphanumeric string
   ko bacha leta tha — is wajah se "Bearer sk_live_..." aur ek saada
   password dono bach gaye the. Ab shak ki soorat mein chhupa diya
   jata hai. */
const isPath = (s) => /^\/[A-Za-z0-9\-_./]*$/.test(s);
const isUrl = (s) => /^(https?:)?\/\/[A-Za-z0-9\-._/]*$/.test(s);
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s);
const isVarName = (s) => /^[A-Z][A-Z0-9_]{2,}$/.test(s);
const isPlainWord = (s) => s.length < 16 && /^[a-z][a-z0-9 ._-]*$/i.test(s);

const keepable = (s) =>
  s.length < 8 || isPath(s) || isUrl(s) || isEmail(s) || isVarName(s) || isPlainWord(s);

/* be-tarteeb lagti hai? (token/hash/base64)
   Pehle sirf "do qism ke harf" dekhta tha, aur us se
   "Cross-Origin-Opener-Policy" jaisa header ka naam bhi token lag kar
   chhup gaya tha. Ab ginti (digit) zaroori hai, aur Title-Case-Hyphen
   wale lafz saaf chhor diye jate hain. */
const titleHyphen = (s) => /^[A-Z][a-z]+(-[A-Za-z][a-z]+)*$/.test(s);
const randomish = (s) => {
  if (s.length < 20) return false;
  if (titleHyphen(s)) return false;
  if (/^[0-9a-f]{24,}$/i.test(s)) return true;            /* hex */
  if (!/[0-9]/.test(s)) return false;                     /* ginti bagair nahi */
  return /^[A-Za-z0-9_\-+/=.]{20,}$/.test(s) && /[a-z]/.test(s);
};

const hide = (s) => '[chhupaya: ' + s.length + ' harf]';

const maskLine = (line) => {
  const sensitive = SENSITIVE_LINE.test(line);
  let masked = 0;

  /* URL ke andar query ke token */
  let outLine = line.replace(/([?&](?:token|key|auth|secret|sig|signature)=)([^&"'\s]{6,})/gi,
    (m, a, b) => { masked++; return a + hide(b); });

  /* quoted strings */
  outLine = outLine.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (m, q, body) => {
    if (!body) return m;
    if (randomish(body)) { masked++; return q + hide(body) + q; }
    if (sensitive && !keepable(body)) { masked++; return q + hide(body) + q; }
    return m;
  });

  return { text: outLine, masked };
};

say('\nfunctions/ KA MATAN — CHAABI CHHUPA KAR');
say('='.repeat(78));
say('   Lambi be-tarteeb strings aur password/token wali lines ki qeemat');
say('   chhupa di gayi hai. Bhejne se pehle khud bhi ek nazar daal lein.');

let totalMasked = 0;

for (const t of targets) {
  const p = path.join(ROOT, t);
  say('');
  say('='.repeat(78));
  say('FILE: ' + t);
  say('='.repeat(78));
  if (!fs.existsSync(p)) { say('   [file nahi mili]'); continue; }
  if (fs.statSync(p).size > 400 * 1024) { say('   [bohat bari file, chhori: ' + fs.statSync(p).size + ' harf]'); continue; }

  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  let fileMasked = 0;
  lines.forEach((l, i) => {
    const { text, masked } = maskLine(l);
    fileMasked += masked;
    say(String(i + 1).padStart(4) + ' | ' + text);
  });
  totalMasked += fileMasked;
  say('');
  say('   [' + lines.length + ' lines, ' + fileMasked + ' jagah chhupai gayi]');
}

say('');
say('='.repeat(78));
say('   kul ' + totalMasked + ' jagah chhupai gayi.');
if (!totalMasked) {
  say('');
  say('   Ek jagah bhi chhupane ki zaroorat nahi pari — yani in files mein');
  say('   koi chaabi likhi hui nahi hai. Yeh achhi khabar hai.');
}
say('');

fs.writeFileSync(path.join(ROOT, '_functions.txt'), out.join('\n') + '\n', 'utf8');
console.log('-'.repeat(78));
console.log('LIKHA: _functions.txt');
