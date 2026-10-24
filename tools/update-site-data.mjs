// src/_data/site.json mein wo fields bharta hai jo Google ko business pehchanne mein madad deti hain,
// aur batata hai ke client se kya kya maloomat leni baqi hai.
//   node tools/update-site-data.mjs           -> sirf dikhata hai
//   node tools/update-site-data.mjs --write   -> file update karta hai
// Jo field pehle se bhari hui ho, usay haath nahi lagata.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const FILE = 'src/_data/site.json';

const site = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const added = [];

const setIfEmpty = (obj, key, value, label) => {
  if (obj[key] === undefined || obj[key] === '' || obj[key] === null) {
    obj[key] = value;
    added.push(`${label} = ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }
};

site.geo = site.geo || {};
setIfEmpty(site.geo, 'region', 'Gilgit-Baltistan', 'geo.region');

site.business = site.business || {};
setIfEmpty(site.business, 'opening_hours', { opens: '09:00', closes: '21:00' }, 'business.opening_hours');

// client se kya chahiye
const NEEDED = [
  ['geo.latitude', site.geo.latitude, 'Office ki GPS latitude (Google Maps par office par right-click -> pehla number)'],
  ['geo.longitude', site.geo.longitude, 'Office ki GPS longitude (dusra number)'],
  ['business.founded_year', site.business.founded_year, 'Company kis saal bani (misal 2008)'],
  ['business.license_number', site.business.license_number, 'Tourism licence / registration number'],
  ['social.youtube', site.social?.youtube, 'YouTube channel ka link'],
  ['social.tripadvisor', site.social?.tripadvisor, 'TripAdvisor page ka link'],
  ['social.google_business', site.social?.google_business, 'Google Business Profile ka link'],
  ['ratings.google_url', site.ratings?.google_url, 'Google reviews ka link'],
  ['verification.google', site.verification?.google, 'Search Console ka verification code (domain live hone ke baad)'],
  ['verification.bing', site.verification?.bing, 'Bing Webmaster ka code (domain live hone ke baad)'],
].filter(([, v]) => !v);

if (added.length) {
  console.log(`${WRITE ? 'Bhar diya' : 'Bharega'}:`);
  added.forEach((a) => console.log('   + ' + a));
} else {
  console.log('Sab default fields pehle se bhari hui hain.');
}

if (NEEDED.length) {
  console.log(`\nClient se yeh maloomat leni hain (${NEEDED.length}):`);
  NEEDED.forEach(([k, , why]) => console.log(`   ${k.padEnd(26)} ${why}`));
  console.log('\nYeh site.json mein bharte hi schema, footer aur Google ke liye khud istemal hone lagti hain.');
}

if (WRITE && added.length) {
  fs.writeFileSync(FILE, JSON.stringify(site, null, 2) + '\n', 'utf8');
  console.log(`\n${FILE} update ho gayi.`);
} else if (!WRITE) {
  console.log('\nAbhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
}
