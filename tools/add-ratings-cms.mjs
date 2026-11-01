#!/usr/bin/env node
/**
 * add-ratings-cms.mjs   (website ke folder mein)
 *
 * .pages.yml mein "ratings" ke khaane jorta hai, taake client Google aur
 * Tripadvisor ke score aur link khud CMS se badal sake. Abhi un ke liye
 * site.json haath se kholni parti hai (ya meri script chalani parti hai).
 *
 * Reviews barhte rehte hain, is liye yeh wahi khaana hai jo client ko
 * sab se zyada badalna paregaa.
 *
 * YAML KO PARSE KAR KE DOBARA LIKHA NAHI JATA. Sirf ek jagah naya matan
 * daala jata hai; baqi file ka ek harf nahi badalta. Parse sirf JAANCH
 * ke liye hota hai — nayi file parh na ho, ya khaanon ki ginti ummeed se
 * alag ho, to kuch nahi likha jata.
 *
 * PowerShell ka Get-Content/Set-Content is file par kabhi na chalayein.
 *
 *   node tools/add-ratings-cms.mjs            -> sirf dikhana
 *   node tools/add-ratings-cms.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, '.pages.yml');
const say = (s = '') => console.log(s);

/* site ke khaanon ke aakhir mein, agli content entry se foran pehle */
const ANCHOR = '\n  - name: site_channels';

const INSERT = `
      - name: ratings
        label: Review scores
        type: object
        description: Shown in the footer, under the Subscribe box.
        fields:
          - name: google_score
            label: Google score
            type: string
            description: 'Such as: 5.0 (12 reviews). Leave empty to show only the word Google.'
          - name: google_url
            label: Google profile link
            type: string
            description: The Google Maps link for the business profile.
          - name: tripadvisor_score
            label: Tripadvisor score
            type: string
            description: Leave empty to show only the word Tripadvisor.
          - name: tripadvisor_url
            label: Tripadvisor link
            type: string
            description: Leave empty to use the Tripadvisor link from Social channels.
  - name: site_channels`;

say('\n.pages.yml — REVIEW SCORES KE KHAANE');
say('='.repeat(76));

if (!fs.existsSync(FILE)) { say('XX  .pages.yml nahi mili.'); process.exit(1); }

const before = fs.readFileSync(FILE, 'utf8');

let docBefore;
try { docBefore = yaml.load(before); }
catch (e) { say('XX  purani .pages.yml hi parh nahi hoti: ' + e.message); process.exit(1); }

const siteEntry = (docBefore.content || []).find((c) => c.name === 'site');
if (!siteEntry) { say('XX  "site" wali entry nahi mili.'); process.exit(1); }

if ((siteEntry.fields || []).some((f) => f.name === 'ratings')) {
  say('-- "ratings" ke khaane pehle se mojood hain. Kuch nahi badla.');
  process.exit(0);
}

const n = before.split(ANCHOR).length - 1;
if (n !== 1) {
  say('XX  jorne ki jagah ' + n + ' baar mili, ek chahiye.');
  say('    Shayad file badal chuki hai. Kuch nahi likha.');
  process.exit(1);
}

const after = before.split(ANCHOR).join(INSERT);

/* ---- jaanch ---- */
let docAfter;
try { docAfter = yaml.load(after); }
catch (e) { say('XX  nayi file parh nahi hoti: ' + e.message); say('    Kuch nahi likha.'); process.exit(1); }

const checks = [];
const cBefore = (docBefore.content || []).length, cAfter = (docAfter.content || []).length;
checks.push(['content entries barabar', cBefore === cAfter, cBefore + ' -> ' + cAfter]);

const siteAfter = (docAfter.content || []).find((c) => c.name === 'site');
const fBefore = (siteEntry.fields || []).length;
const fAfter = siteAfter ? (siteAfter.fields || []).length : -1;
checks.push(['site ke khaane +1', fAfter === fBefore + 1, fBefore + ' -> ' + fAfter]);

const r = siteAfter && (siteAfter.fields || []).find((f) => f.name === 'ratings');
checks.push(['ratings mojood', !!r, r ? 'haan' : 'nahi']);
checks.push(['ratings ke andar 4 khaane', !!(r && (r.fields || []).length === 4), r ? (r.fields || []).length + '' : '-']);

const want = ['google_score', 'google_url', 'tripadvisor_score', 'tripadvisor_url'];
const got = r ? (r.fields || []).map((f) => f.name) : [];
checks.push(['naam site.json se milte hain', JSON.stringify(got) === JSON.stringify(want), got.join(', ') || '-']);

/* developer aur credentials jahan the wahin hain? */
for (const k of ['credentials', 'developer']) {
  const had = (siteEntry.fields || []).some((f) => f.name === k);
  const has = siteAfter && (siteAfter.fields || []).some((f) => f.name === k);
  checks.push([k + ' waisa hi hai', had === has, had ? 'tha aur hai' : 'nahi tha']);
}

const untouched = before.split(ANCHOR)[0] === after.split(INSERT)[0]
  && before.split(ANCHOR)[1] === after.split(INSERT)[1];
checks.push(['baqi file ka ek harf nahi badla', untouched, untouched ? 'haan' : 'nahi']);

say('');
say('   JAANCH');
say('   ' + '-'.repeat(70));
let ok = true;
for (const [label, pass, detail] of checks) {
  if (!pass) ok = false;
  say('      ' + (pass ? 'OK ' : 'XX ') + label.padEnd(34) + detail);
}

say('');
if (!ok) { say('XX  jaanch nakaam — kuch nahi likha.'); process.exit(1); }

say('   Naye khaane: Google score, Google profile link,');
say('                Tripadvisor score, Tripadvisor link');
say('   Jagah: Site settings  >  sab se aakhir, Website credit ke baad');
say('   File: ' + before.length + ' -> ' + after.length + ' harf');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/add-ratings-cms.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakratings')) fs.copyFileSync(FILE, FILE + '.bakratings');
fs.writeFileSync(FILE, after, 'utf8');
say('LIKHA: .pages.yml   (backup: .pages.yml.bakratings)');
say('');
say('CMS kholein: Site settings  >  Review scores');
say('Reviews barhein to client khud wahan se number badal lega.');
