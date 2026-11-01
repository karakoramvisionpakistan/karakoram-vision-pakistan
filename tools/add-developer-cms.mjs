#!/usr/bin/env node
/**
 * add-developer-cms.mjs   (website ke folder mein)
 *
 * .pages.yml mein "developer" ke khaane jorta hai, taake aap ka naam,
 * darja aur links CMS se badle ja sakein — site.json haath se kholne ki
 * zaroorat na rahe.
 *
 * Yeh khaane "Business details" ke andar, "Licence and memberships" ke
 * foran baad aate hain.
 *
 * YAML KO PARSE KAR KE DOBARA LIKHA NAHI JATA. Sirf ek jagah naya matan
 * daala jata hai; baqi file ka ek harf nahi badalta. Parse sirf JAANCH ke
 * liye hota hai — agar nayi file parh na ho, ya khaanon ki ginti ummeed
 * se alag ho, to kuch nahi likha jata.
 *
 * PowerShell ka Get-Content/Set-Content is file par kabhi na chalayein —
 * woh encoding badal deta hai. Yeh Node hai.
 *
 *   node tools/add-developer-cms.mjs            -> sirf dikhana
 *   node tools/add-developer-cms.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, '.pages.yml');
const say = (s = '') => console.log(s);

/* Jahan daalna hai: credentials ka aakhri khaana, phir agli entry. */
const ANCHOR = `          - name: experience_note
            label: Experience note
            type: text
  - name: site_channels`;

const INSERT = `          - name: experience_note
            label: Experience note
            type: text
      - name: developer
        label: Website credit
        type: object
        description: Shown at the very bottom of every page.
        fields:
          - name: show
            label: Show this
            type: boolean
          - name: prefix
            label: Lead-in text
            type: string
            description: 'Such as: Designed and developed by'
          - name: name
            label: Name
            type: string
          - name: role
            label: Role
            type: string
            description: Shown in small capitals under the name.
          - name: links
            label: Links
            type: object
            list: true
            description: Add one or more. The name then becomes a menu that opens on click. Rows with an empty URL are skipped, so you can leave one ready and fill it later.
            fields:
              - name: label
                label: Label
                type: string
                description: 'Such as: GitHub'
              - name: url
                label: URL
                type: string
  - name: site_channels`;

say('\n.pages.yml — DEVELOPER KE KHAANE');
say('='.repeat(76));

if (!fs.existsSync(FILE)) { say('XX  .pages.yml nahi mili.'); process.exit(1); }

const before = fs.readFileSync(FILE, 'utf8');

/* purani file parh hoti hai? */
let docBefore;
try { docBefore = yaml.load(before); }
catch (e) { say('XX  purani .pages.yml hi parh nahi hoti: ' + e.message); say('    Kuch nahi badla.'); process.exit(1); }

const siteEntry = (docBefore.content || []).find((c) => c.name === 'site');
if (!siteEntry) { say('XX  "site" wali entry nahi mili.'); process.exit(1); }

const had = (siteEntry.fields || []).some((f) => f.name === 'developer');
if (had) { say('-- "developer" ke khaane pehle se mojood hain. Kuch nahi badla.'); process.exit(0); }

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

const dev = siteAfter && (siteAfter.fields || []).find((f) => f.name === 'developer');
checks.push(['developer mojood', !!dev, dev ? 'haan' : 'nahi']);
checks.push(['developer ke andar 5 khaane', dev && (dev.fields || []).length === 5, dev ? (dev.fields || []).length + '' : '-']);
const links = dev && (dev.fields || []).find((f) => f.name === 'links');
checks.push(['links list hai', !!(links && links.list === true), links ? String(links.list) : '-']);
checks.push(['links ke andar label aur url', !!(links && (links.fields || []).length === 2), links ? (links.fields || []).length + '' : '-']);

/* baqi file bilkul waisi hai? */
const untouched = before.split(ANCHOR)[0] === after.split(INSERT)[0]
  && before.split(ANCHOR)[1] === after.split(INSERT)[1];
checks.push(['baqi file ka ek harf nahi badla', untouched, untouched ? 'haan' : 'nahi']);

say('');
say('   JAANCH');
say('   ' + '-'.repeat(70));
let ok = true;
for (const [label, pass, detail] of checks) {
  if (!pass) ok = false;
  say('      ' + (pass ? 'OK ' : 'XX ') + label.padEnd(36) + detail);
}

say('');
if (!ok) { say('XX  jaanch nakaam — kuch nahi likha.'); process.exit(1); }

say('   Naye khaane: Show this, Lead-in text, Name, Role, Links (label + URL, jitne chahein)');
say('   Jagah: Business details  >  Licence and memberships ke foran baad');
say('   File: ' + before.length + ' -> ' + after.length + ' harf');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/add-developer-cms.mjs --write');
  process.exit(0);
}

if (!fs.existsSync(FILE + '.bakdev')) fs.copyFileSync(FILE, FILE + '.bakdev');
fs.writeFileSync(FILE, after, 'utf8');
say('LIKHA: .pages.yml   (backup: .pages.yml.bakdev)');
say('');
say('CMS kholein: Business details  >  Website credit');
say('Links mein GitHub ya jo bhi chahein daal dein — naam khud ba khud menu ban jayega.');
