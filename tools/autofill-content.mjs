// Build ke waqt woh khane khud bhar deta hai jo baqi data se nikal aate hain,
// taake client ko form mein kam likhna pare.
//
// Qaida: SIRF khali khane bharta hai. Jo client ne khud likha hai, usey kabhi
// nahi chherta. Is liye ghalat bharne ka darr nahi - client jab chahe apni
// value likh de, agli build us ko waisa hi chhor degi.
//
// Kya kya nikalta hai:
//   slug             <- file ka naam (URL isi se banta hai, is liye title badalne par URL nahi toot-ta)
//   duration_days    <- itinerary mein sab se bara "Day N"
//   duration         <- "<N> Days"
//   departure_type   <- fixed_departure ka khana on hai ya nahi
//   trip_status      <- "Available"
//   cover_image_alt  <- title (+ destination)
//   summary          <- body ka pehla paragraph
//   answer_summary   <- summary ka pehla jumla
//   key_facts        <- duration / difficulty / destination / group size / price
//   author           <- site.json ka business naam
//   reviewed_by      <- wahi
//   last_verified    <- git mein is file ka aakhri commit ki tareekh
//   seo.title        <- title (+ duration) + brand, 60 character tak
//   seo.description  <- answer_summary ya summary, 70-158 character
//   packing_list     <- contentDefaults.json se (section ke hisaab se)
//   included/excluded<- contentDefaults.json se, LEKIN sirf tab jab us ka switch on ho
//
//   node tools/autofill-content.mjs           -> bhar deta hai (build isi tarah chalata hai)
//   node tools/autofill-content.mjs --check   -> sirf batata hai, kuch nahi badalta
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CHECK = process.argv.includes('--check');
const ROOT = 'src/content';
const SITE = 'src/_data/site.json';
const DEFAULTS = 'src/_data/contentDefaults.json';

// file ka folder -> section
const SECTIONS = {
  tours: 'tours',
  trekking: 'trekking',
  expeditions: 'expeditions',
  'jeep-safaris': 'jeep-safaris',
  'hunting-services': 'hunting-services',
  vehicles: 'vehicles',
  blog: 'blog',
  pages: 'pages',
};
const JOURNEYS = new Set(['tours', 'trekking', 'expeditions', 'jeep-safaris', 'hunting-services']);

const readJson = (p, fallback) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
};
const site = readJson(SITE, {});
const defaults = readJson(DEFAULTS, { auto_fill: {}, sections: {} });
const brandShort = 'Karakoram Vision';
const brandAuthor = site.business?.legal_name || site.name || brandShort;

const walk = (dir) => fs.readdirSync(dir).flatMap((name) => {
  const p = path.join(dir, name);
  return fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});

// ------------------------------------------------------------------ helpers
const stripHtml = (html) => String(html || '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ').trim();

const trimAtWord = (s, max) => {
  const t = String(s || '').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:–—-]+$/, '');
};

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const yamlStr = (s) => JSON.stringify(String(s));

let gitWorks = true;
function lastCommitDate(file) {
  if (!gitWorks) return '';
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : '';
  } catch {
    gitWorks = false;
    return '';
  }
}

// ------------------------------------------------- front matter (line based)
function splitFile(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0].replace(/^﻿/, '') !== '---') return null;
  let end = 1;
  while (end < lines.length && lines[end] !== '---') end++;
  if (end >= lines.length) return null;
  return { lines, fmEnd: end, nl: text.includes('\r\n') ? '\r\n' : '\n' };
}

const indentOf = (l) => (l.match(/^[ \t]*/) || [''])[0].length;

function findKey(lines, fmEnd, key, indent = 0) {
  const rx = new RegExp(`^${' '.repeat(indent)}${key}:`);
  for (let i = 1; i < fmEnd; i++) {
    if (indentOf(lines[i]) === indent && rx.test(lines[i])) return i;
  }
  return -1;
}

// Scalar khali hai? (key gayab, ya "", '', null, ya khali)
function scalarEmpty(lines, fmEnd, key, indent = 0) {
  const at = findKey(lines, fmEnd, key, indent);
  if (at === -1) return true;
  const v = lines[at].slice(lines[at].indexOf(':') + 1).trim();
  return v === '' || v === '""' || v === "''" || v === 'null' || v === '~';
}

// List khali hai? (key gayab, [] , ya koi "- " item nahi)
function listEmpty(lines, fmEnd, key) {
  const at = findKey(lines, fmEnd, key);
  if (at === -1) return true;
  const inline = lines[at].slice(lines[at].indexOf(':') + 1).trim();
  if (inline && inline !== '[]') return false;
  for (let i = at + 1; i < fmEnd; i++) {
    if (lines[i].trim() === '') continue;
    if (indentOf(lines[i]) === 0) break;
    if (/^\s+-\s/.test(lines[i])) return false;
    break;
  }
  return true;
}

function endOfKey(lines, fmEnd, at) {
  let last = at;
  for (let i = at + 1; i < fmEnd; i++) {
    if (lines[i].trim() === '' || indentOf(lines[i]) > 0) { last = i; continue; }
    break;
  }
  return last;
}

// Scalar set karna. fmEnd badal sakta hai, is liye naya fmEnd wapas deta hai.
function setScalar(lines, fmEnd, key, value) {
  const at = findKey(lines, fmEnd, key);
  const line = `${key}: ${yamlStr(value)}`;
  if (at === -1) {
    let insertAt = findKey(lines, fmEnd, 'seo');
    if (insertAt === -1) insertAt = fmEnd;
    lines.splice(insertAt, 0, line);
    return fmEnd + 1;
  }
  const last = endOfKey(lines, fmEnd, at);
  lines.splice(at, last - at + 1, line);
  return fmEnd - (last - at);
}

function setList(lines, fmEnd, key, items) {
  const block = [`${key}:`, ...items.map((i) => `  - ${yamlStr(i)}`)];
  const at = findKey(lines, fmEnd, key);
  if (at === -1) {
    let insertAt = findKey(lines, fmEnd, 'seo');
    if (insertAt === -1) insertAt = fmEnd;
    lines.splice(insertAt, 0, ...block);
    return fmEnd + block.length;
  }
  const last = endOfKey(lines, fmEnd, at);
  lines.splice(at, last - at + 1, ...block);
  return fmEnd + block.length - (last - at + 1);
}

function setObjectList(lines, fmEnd, key, rows) {
  const block = [`${key}:`];
  for (const row of rows) {
    const keys = Object.keys(row);
    keys.forEach((k, i) => {
      block.push(`  ${i === 0 ? '- ' : '  '}${k}: ${yamlStr(row[k])}`);
    });
  }
  const at = findKey(lines, fmEnd, key);
  if (at === -1) {
    let insertAt = findKey(lines, fmEnd, 'seo');
    if (insertAt === -1) insertAt = fmEnd;
    lines.splice(insertAt, 0, ...block);
    return fmEnd + block.length;
  }
  const last = endOfKey(lines, fmEnd, at);
  lines.splice(at, last - at + 1, ...block);
  return fmEnd + block.length - (last - at + 1);
}

// seo: ke andar ka khana (2 space indent)
function setSeoChild(lines, fmEnd, key, value) {
  const seoAt = findKey(lines, fmEnd, 'seo');
  const line = `  ${key}: ${yamlStr(value)}`;
  if (seoAt === -1) {
    lines.splice(fmEnd, 0, 'seo:', line);
    return fmEnd + 2;
  }
  const last = endOfKey(lines, fmEnd, seoAt);
  for (let i = seoAt + 1; i <= last; i++) {
    if (indentOf(lines[i]) === 2 && new RegExp(`^  ${key}:`).test(lines[i])) {
      const childLast = (() => {
        let l = i;
        for (let j = i + 1; j <= last; j++) {
          if (lines[j].trim() === '' || indentOf(lines[j]) > 2) { l = j; continue; }
          break;
        }
        return l;
      })();
      lines.splice(i, childLast - i + 1, line);
      return fmEnd - (childLast - i);
    }
  }
  lines.splice(seoAt + 1, 0, line);
  return fmEnd + 1;
}

function seoChildEmpty(lines, fmEnd, key) {
  const seoAt = findKey(lines, fmEnd, 'seo');
  if (seoAt === -1) return true;
  const last = endOfKey(lines, fmEnd, seoAt);
  for (let i = seoAt + 1; i <= last; i++) {
    if (indentOf(lines[i]) === 2 && new RegExp(`^  ${key}:`).test(lines[i])) {
      const v = lines[i].slice(lines[i].indexOf(':') + 1).trim();
      return v === '' || v === '""' || v === "''" || v === 'null';
    }
  }
  return true;
}

function readScalar(lines, fmEnd, key) {
  const at = findKey(lines, fmEnd, key);
  if (at === -1) return '';
  let v = lines[at].slice(lines[at].indexOf(':') + 1).trim();
  if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
  if (v === '>-' || v === '|' || v === '>' || v === '|-') {
    const parts = [];
    for (let i = at + 1; i < fmEnd && indentOf(lines[i]) > 0; i++) parts.push(lines[i].trim());
    v = parts.join(' ');
  }
  return v;
}

// ------------------------------------------------------------------ run
const files = walk(ROOT);
const filled = {};
let touched = 0;
const details = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = splitFile(text);
  if (!parsed) { details.push(`front matter nahi mila: ${file}`); continue; }

  const { lines, nl } = parsed;
  let fmEnd = parsed.fmEnd;
  const body = text.split(/\r?\n---/).slice(1).join('\n---');
  const folder = path.relative(ROOT, file).split(path.sep)[0];
  const section = SECTIONS[folder] || folder;
  const isJourney = JOURNEYS.has(section);
  const did = [];
  const mark = (k) => { did.push(k); filled[k] = (filled[k] || 0) + 1; };

  // --- slug (file ke naam se; URL isi par bana rehta hai)
  if (scalarEmpty(lines, fmEnd, 'slug')) {
    const title = readScalar(lines, fmEnd, 'title');
    const value = slugify(path.basename(file, '.md')) || slugify(title);
    if (value) { fmEnd = setScalar(lines, fmEnd, 'slug', value); mark('slug'); }
  }

  // --- duration_days / duration (itinerary se)
  if (isJourney) {
    const dayNums = [...String(body).matchAll(/\bday\s*0*(\d{1,3})\b/gi)].map((m) => Number(m[1]));
    const maxDay = dayNums.length ? Math.max(...dayNums) : 0;
    const sane = maxDay >= 2 && maxDay <= 120 ? maxDay : 0;

    if (sane && scalarEmpty(lines, fmEnd, 'duration_days')) {
      fmEnd = setScalar(lines, fmEnd, 'duration_days', String(sane));
      mark('duration_days');
    }
    if (scalarEmpty(lines, fmEnd, 'duration')) {
      const dd = sane || Number(readScalar(lines, fmEnd, 'duration_days')) || 0;
      if (dd) { fmEnd = setScalar(lines, fmEnd, 'duration', `${dd} Days`); mark('duration'); }
    }
  }

  // --- departure_type / trip_status
  if (isJourney) {
    if (scalarEmpty(lines, fmEnd, 'departure_type')) {
      const fixed = /^true$/i.test(readScalar(lines, fmEnd, 'fixed_departure'));
      fmEnd = setScalar(lines, fmEnd, 'departure_type', fixed ? 'Fixed Departure' : 'Private');
      mark('departure_type');
    }
    if (scalarEmpty(lines, fmEnd, 'trip_status')) {
      fmEnd = setScalar(lines, fmEnd, 'trip_status', 'Available');
      mark('trip_status');
    }
  }

  // --- summary (body ke pehle paragraph se)
  if (scalarEmpty(lines, fmEnd, 'summary')) {
    const first = (String(body).match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
    const value = trimAtWord(stripHtml(first || body), 190);
    if (value.length >= 40) { fmEnd = setScalar(lines, fmEnd, 'summary', value); mark('summary'); }
  }

  const title = readScalar(lines, fmEnd, 'title');
  const summary = readScalar(lines, fmEnd, 'summary');
  const destination = readScalar(lines, fmEnd, 'destination');
  const duration = readScalar(lines, fmEnd, 'duration');
  const difficulty = readScalar(lines, fmEnd, 'difficulty');
  const groupSize = readScalar(lines, fmEnd, 'group_size');
  const priceFrom = readScalar(lines, fmEnd, 'price_from');

  // --- answer_summary (summary ke pehle do jumle)
  if (scalarEmpty(lines, fmEnd, 'answer_summary') && summary) {
    const sentences = summary.split(/(?<=[.!?])\s+/);
    const value = trimAtWord(sentences.slice(0, 2).join(' '), 230);
    if (value.length >= 40) { fmEnd = setScalar(lines, fmEnd, 'answer_summary', value); mark('answer_summary'); }
  }

  // --- cover_image_alt
  // Alt text sirf tab, jab cover photo mojood ho - warna uska koi faida nahi.
  const hasCover = !scalarEmpty(lines, fmEnd, 'cover_image');
  if (hasCover && scalarEmpty(lines, fmEnd, 'cover_image_alt') && title) {
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    const cleanDest = destination.replace(/\s+/g, ' ').trim();
    // Destination sirf tab jorein jab woh title se mukhtalif ho
    const tok = (s) => new Set(
      s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
        .filter((w) => w.length >= 2 && !['and', 'the', 'of', 'to', 'in'].includes(w))
    );
    const titleTokens = tok(cleanTitle);
    const overlap = cleanDest && [...tok(cleanDest)].some((w) => titleTokens.has(w));
    const value = cleanDest && !overlap ? `${cleanTitle} — ${cleanDest}` : `${cleanTitle}, northern Pakistan`;
    fmEnd = setScalar(lines, fmEnd, 'cover_image_alt', trimAtWord(value, 120));
    mark('cover_image_alt');
  }

  // --- key_facts
  if (isJourney && listEmpty(lines, fmEnd, 'key_facts')) {
    const rows = [];
    if (duration) rows.push({ label: 'Duration', value: duration });
    if (difficulty) rows.push({ label: 'Difficulty', value: difficulty });
    if (destination) rows.push({ label: 'Destination', value: destination });
    if (groupSize) rows.push({ label: 'Group size', value: groupSize });
    if (priceFrom) rows.push({ label: 'Price from', value: priceFrom });
    if (rows.length >= 2) { fmEnd = setObjectList(lines, fmEnd, 'key_facts', rows); mark('key_facts'); }
  }

  // --- author / reviewed_by / last_verified
  if (scalarEmpty(lines, fmEnd, 'author')) { fmEnd = setScalar(lines, fmEnd, 'author', brandAuthor); mark('author'); }
  if (scalarEmpty(lines, fmEnd, 'reviewed_by')) { fmEnd = setScalar(lines, fmEnd, 'reviewed_by', brandAuthor); mark('reviewed_by'); }
  if (scalarEmpty(lines, fmEnd, 'last_verified')) {
    const date = lastCommitDate(file);
    if (date) { fmEnd = setScalar(lines, fmEnd, 'last_verified', date); mark('last_verified'); }
  }

  // --- seo.title / seo.description
  if (title && seoChildEmpty(lines, fmEnd, 'title')) {
    let t = trimAtWord(title, 60);
    if (duration && !new RegExp(duration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(t)) {
      const withDays = `${t} — ${duration}`;
      if (withDays.length <= 60) t = withDays;
    }
    const withBrand = `${t} | ${brandShort}`;
    if (withBrand.length <= 60) t = withBrand;
    fmEnd = setSeoChild(lines, fmEnd, 'title', t);
    mark('seo.title');
  }
  if (seoChildEmpty(lines, fmEnd, 'description')) {
    let d = readScalar(lines, fmEnd, 'answer_summary') || summary || '';
    d = stripHtml(d);
    if (d) {
      if (d.length > 158) d = `${trimAtWord(d, 155)}…`;
      if (d.length < 70) {
        const bits = [duration, destination].filter(Boolean);
        if (bits.length) d = `${d} ${bits.join(', ')}.`.replace(/\s+/g, ' ').trim();
      }
      if (d.length < 70 && isJourney) d = `${d} Dates, prices and inclusions on request.`.trim();
      if (d.length > 158) d = `${trimAtWord(d, 155)}…`;
      fmEnd = setSeoChild(lines, fmEnd, 'description', d);
      mark('seo.description');
    }
  }

  // --- packing_list / included / excluded (contentDefaults.json se)
  const sectionDefaults = defaults.sections?.[section];
  if (sectionDefaults) {
    for (const key of ['packing_list', 'included', 'excluded']) {
      if (!defaults.auto_fill?.[key]) continue;
      const items = sectionDefaults[key];
      if (!Array.isArray(items) || !items.length) continue;
      if (!listEmpty(lines, fmEnd, key)) continue;
      fmEnd = setList(lines, fmEnd, key, items);
      mark(key);
    }
  }

  if (!did.length) continue;
  touched++;
  details.push(`${file}  ->  ${did.join(', ')}`);
  if (!CHECK) fs.writeFileSync(file, lines.join(nl), 'utf8');
}

if (details.length) console.log(details.join('\n'));
const totals = Object.entries(filled).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
console.log(`Autofill: ${touched}/${files.length} files${totals ? ` — ${totals}` : ''}${CHECK ? '  (check only, kuch nahi badla)' : ''}`);
if (!gitWorks) console.log('Autofill: git se tareekh nahi mili, "last verified" chhor diya.');
