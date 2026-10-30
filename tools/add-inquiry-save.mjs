#!/usr/bin/env node
/**
 * add-inquiry-save.mjs
 *
 * WEBSITE ke folder mein chalani hai (D:\Websites\Karakoram_Vision_Pakistan).
 *
 * Abhi trip request sirf email par jaati hai aur Google Sheet mein copy hoti
 * hai — database mein kahin mehfooz nahi hoti, isi liye dashboard mein inbox
 * nahi ban sakta tha.
 *
 * Yeh script har darkhwast ko `inquiries` ke khaane mein bhi likh deti hai.
 * Email aur Sheet pehle ki tarah chalte rahenge — yeh un ke alawa hai.
 *
 *   node tools/add-inquiry-save.mjs            -> sirf dekhna
 *   node tools/add-inquiry-save.mjs --write    -> save karna
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, 'functions', 'api', 'trip-request.js');

if (!fs.existsSync(FILE)) {
  console.log('XX  functions/api/trip-request.js nahi mili.');
  console.log('    Yeh script website ke folder mein chalani hai.');
  process.exit(1);
}

let text = fs.readFileSync(FILE, 'utf8');

if (text.includes('saveInquiry')) {
  console.log('OK  pehle se laga hua hai.');
  process.exit(0);
}

const steps = [];
const apply = (what, find, to) => {
  if (!text.includes(find)) { console.log('XX  nahi mila: ' + what); process.exit(1); }
  text = text.replace(find, to);
  steps.push(what);
};

/* 1) database kab istemaal hoga */
apply('inquiry database ka switch',
  '  const dbConfigured = Boolean(isReview && env.DB);',
  '  const dbConfigured = Boolean(isReview && env.DB);\n' +
  '  const inquiryDbConfigured = Boolean(!isReview && env.DB);'
);

/* 2) "kuch bhi set nahi" wali jaanch */
apply('"kuch set nahi" wali jaanch',
  '  if (!emailConfigured && !sheetConfigured && !dbConfigured) {',
  '  if (!emailConfigured && !sheetConfigured && !dbConfigured && !inquiryDbConfigured) {'
);

/* 3) saveInquiry + Promise.allSettled */
apply('darkhwast mehfooz karna',
  '  const [mailResult, sheetResult, dbResult] = await Promise.allSettled([sendEmail(), saveToSheet(), saveReview()]);',
  '  // Darkhwast dashboard ke inbox mein mehfooz hoti hai. Email aur Sheet\n' +
  '  // pehle ki tarah chalte rahenge — yeh un ke alawa hai, un ki jagah nahi.\n' +
  '  const saveInquiry = async () => {\n' +
  "    if (!inquiryDbConfigured) throw new Error('inquiry database not used');\n" +
  '    const pick = (...keys) => {\n' +
  '      for (const key of keys) {\n' +
  '        const value = form.get(key);\n' +
  "        if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 400);\n" +
  '      }\n' +
  '      return null;\n' +
  '    };\n' +
  '    await env.DB.prepare(\n' +
  "      'INSERT INTO inquiries (name, email, phone, journey, service, travel_date, group_size, message, payload, page, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'\n" +
  '    ).bind(\n' +
  "      name || pick('full_name', 'name'),\n" +
  "      email || pick('email'),\n" +
  "      pick('phone', 'whatsapp', 'contact_number', 'mobile'),\n" +
  "      pick('journey', 'trip', 'package', 'tour'),\n" +
  "      pick('service', 'service_type'),\n" +
  "      pick('travel_date', 'start_date', 'start', 'dates', 'travel_dates'),\n" +
  "      pick('group_size', 'travellers', 'travelers', 'people', 'adults'),\n" +
  "      pick('message', 'notes', 'details', 'comments', 'requirements'),\n" +
  '      JSON.stringify(Object.fromEntries(rows)),\n' +
  '      meta.Page,\n' +
  '      meta.IP\n' +
  '    ).run();\n' +
  '  };\n' +
  '\n' +
  '  const [mailResult, sheetResult, dbResult, inquiryResult] = await Promise.allSettled([sendEmail(), saveToSheet(), saveReview(), saveInquiry()]);'
);

/* 4) nakami ki report */
apply('nakami ki report',
  "  if (dbResult.status === 'rejected' && dbConfigured) console.error('trip-request: database failed:', dbResult.reason && dbResult.reason.message);",
  "  if (dbResult.status === 'rejected' && dbConfigured) console.error('trip-request: database failed:', dbResult.reason && dbResult.reason.message);\n" +
  "  if (inquiryResult.status === 'rejected' && inquiryDbConfigured) console.error('trip-request: inquiry save failed:', inquiryResult.reason && inquiryResult.reason.message);"
);

/* 5) kamyabi ki shart */
apply('kamyabi ki shart',
  "  if (mailResult.status === 'fulfilled' || sheetResult.status === 'fulfilled' || dbResult.status === 'fulfilled') return succeed();",
  "  if (mailResult.status === 'fulfilled' || sheetResult.status === 'fulfilled' || dbResult.status === 'fulfilled' || inquiryResult.status === 'fulfilled') return succeed();"
);

/* 6) debug */
apply('debug detail',
  "    return json({ ok: false, error: 'send_failed', detail: { email: why(mailResult), sheet: why(sheetResult), db: why(dbResult) } }, 502);",
  "    return json({ ok: false, error: 'send_failed', detail: { email: why(mailResult), sheet: why(sheetResult), db: why(dbResult), inquiry: why(inquiryResult) } }, 502);"
);

console.log('\nTabdeeliyan:');
for (const s of steps) console.log('   ->  ' + s);

console.log('\n--------------------------------------------------');

if (!WRITE) {
  console.log('Save karne ke liye:');
  console.log('   node tools/add-inquiry-save.mjs --write');
  process.exit(0);
}

fs.copyFileSync(FILE, FILE + '.bak');
fs.writeFileSync(FILE, text, 'utf8');
console.log('LIKHA: functions/api/trip-request.js   (backup: trip-request.js.bak)');
console.log('\nYaad rahe: website ke Cloudflare Pages project par bhi D1 database');
console.log('"DB" ke naam se bandha hona chahiye, warna darkhwast mehfooz nahi hogi');
console.log('(email aur Sheet phir bhi chalte rahenge).');
