// Website ke har page ka "dikhao ya chhupao" wala switch sambhalta hai.
//
// Masla: website ke bohot se pages template ki soorat mein likhe hue hain
// (src/holiday-types/index.njk jaise). CMS unhein content nahi samajhta, is
// liye client na unhein chhupa sakta tha na hata sakta tha - aur adhoore pages
// website par pare rehte thay.
//
// Yeh tool ek fehrist banata hai: src/_data/pageControl.json - jis mein har
// page ek entry hai aur har entry par ek switch. CMS us fehrist ko ek screen
// ki soorat mein dikhata hai.
//
// "Chhupaya hua" ka matlab yahan poora chhupana hai: page BUILD HI NAHI HOTA.
// Na us ka address khulta hai, na woh sitemap mein aata hai, na search mein,
// na kisi fehrist mein. Google ko bhi nazar nahi aata. Lekin file apni jagah
// mojood rehti hai, to switch wapas chalu karte hi page lout aata hai.
//
// Tool fehrist khud banata aur sambhalta hai:
//   - naya page bane to woh fehrist mein aa jata hai (chalu haalat mein)
//   - page hata diya jaye to us ki entry nikal jati hai
//   - client ne jo switch band kiye hain woh waise hi rehte hain
//
//   node tools/page-control.mjs           -> fehrist nayi karta hai
//   node tools/page-control.mjs --check   -> sirf batata hai, kuch nahi badalta
import fs from 'node:fs';
import path from 'node:path';

const CHECK = process.argv.includes('--check');
const OUT = 'src/_data/pageControl.json';
const SRC = 'src';
const CONTENT = 'src/content';

// Yeh pages fehrist mein nahi aate:
//   index      - ghar ka safha; isey chhupane ka matlab poori website band
//   404        - galat address par yahi khulta hai
//   offline    - internet na ho to yahi dikhta hai
//   search     - website ki apni talash
const NEVER = new Set(['src/index.njk', 'src/404.njk', 'src/offline/index.njk', 'src/search/index.njk']);

// ------------------------------------------------------------------ helpers
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).flatMap((n) => {
  const p = path.join(dir, n);
  return fs.statSync(p).isDirectory() ? walk(p) : [p];
}) : []);

const rel = (p) => p.split(path.sep).join('/');

function frontMatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  return m ? m[1] : '';
}

function fmValue(fm, key) {
  const m = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(fm);
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '').trim();
}

// Page ka naam jo client ko samajh aaye: "/holiday-types/" -> "Holiday Types"
function labelFor(fm, url, file) {
  const title = fmValue(fm, 'title');
  if (title) return title;
  const bits = url.split('/').filter(Boolean);
  const last = bits[bits.length - 1] || path.basename(path.dirname(file));
  return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ------------------------------------------------------------------ jama karo
// Template wale pages: woh .njk jin ka apna layout aur apna address hai.
// sitemap, robots, feed wagera chhoot jate hain kyunke un ka address file ke
// naam par khatam hota hai, folder par nahi.
const allTemplates = walk(SRC)
  .map(rel)
  .filter((p) => p.endsWith('.njk'))
  .filter((p) => !p.startsWith('src/_includes/') && !p.startsWith('src/_data/'))
  .map((p) => ({ file: p, fm: frontMatter(p) }))
  .filter(({ fm }) => fmValue(fm, 'layout') && /^\/.*\/?$/.test(fmValue(fm, 'permalink')))
  .map(({ file, fm }) => {
    const url = fmValue(fm, 'permalink');
    return { file, url, label: labelFor(fm, url, file) };
  });

// Fehrist mein woh pages aate hain jinhein chhupaya ja sakta hai.
const templates = allTemplates.filter((t) => !NEVER.has(t.file));
// Yeh hamesha chalte hain - fehrist mein nahi, lekin menu ke link in par ja
// sakte hain, is liye inhein "zinda" mein ginna zaroori hai.
const alwaysOn = allTemplates.filter((t) => NEVER.has(t.file)).map((t) => t.url);

// Content wale pages: in par switch pehle se un ki apni file mein hai, is liye
// yeh fehrist mein nahi aate - lekin chhupane ka kaam wahi hona chahiye jo
// yahan hota hai. Is liye un mein se band kiye hue jama kar lete hain.
const contentPages = walk(CONTENT)
  .map(rel)
  .filter((p) => p.endsWith('.md'))
  .map((p) => {
    const fm = frontMatter(p);
    return { file: p, url: fmValue(fm, 'permalink'), live: fmValue(fm, 'published').toLowerCase() !== 'false' };
  });
const hiddenContent = contentPages.filter((c) => !c.live).map((c) => c.file);

// ------------------------------------------------------------------ fehrist
let old = { pages: [] };
try { old = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* pehli dafa */ }
const before = new Map((old.pages || []).map((p) => [p.file, p]));

const pages = templates
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((t) => {
    const prev = before.get(t.file) || {};
    return {
      label: t.label,
      url: t.url,
      // Client ka chuna hua switch kabhi na badlo
      published: prev.published === false ? false : true,
      redirect_to: prev.redirect_to || '',
      file: t.file,
    };
  });

const added = pages.filter((p) => !before.has(p.file)).map((p) => p.label);
const gone = [...before.keys()].filter((f) => !pages.some((p) => p.file === f));

// Jo kuch build se bahar rakhna hai - eleventy.config.js yahi fehrist parhta hai.
const hidden = [
  ...pages.filter((p) => p.published === false).map((p) => p.file),
  ...hiddenContent,
].sort();

// Jin chhupe hue pages ka naya pata diya gaya hai
const redirects = pages
  .filter((p) => p.published === false && String(p.redirect_to || '').trim())
  .map((p) => ({ from: p.url, to: String(p.redirect_to).trim() }));

// ------------------------------------------------------------------ naya pata
// Jo page chhupa diya gaya ho aur us ka naya pata diya gaya ho, us ke purane
// pate par aane walon ko wahan bhej dete hain. Cloudflare yeh _redirects file
// se karta hai. Niche wala hissa khud banta hai - haath se na badlein.
const REDIR = 'src/_redirects';
const START = '# >>> chhupe hue pages - khud banta hai, haath se na badlein';
const END = '# <<< chhupe hue pages';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (!CHECK && fs.existsSync(REDIR)) {
  const raw = fs.readFileSync(REDIR, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const block = redirects.length
    ? [START, ...redirects.map((r) => `${r.from}  ${r.to}  301`), END].join(nl)
    : '';
  const re = new RegExp(`${esc(START)}[\\s\\S]*?${esc(END)}\\r?\\n?`);
  let out = raw;
  if (re.test(out)) out = out.replace(re, block ? `${block}${nl}` : '');
  else if (block) out = `${out.replace(/\s*$/, '')}${nl}${nl}${block}${nl}`;
  if (out !== raw) fs.writeFileSync(REDIR, out, 'utf8');
}

// Chhupe hue pages ke pate - menu inhi ko dekh kar apne khanay chhupata hai.
const hiddenUrls = [
  ...pages.filter((p) => p.published === false).map((p) => p.url),
  ...contentPages.filter((c) => !c.live && c.url).map((c) => c.url),
].filter(Boolean).sort();

// ------------------------------------------------------------------ menu ki jaanch
// menu.json mein 31 KB ke link haath se likhe hue hain. Un mein se kai aise ho
// sakte hain jo kisi maujood page par jate hi nahi - aur abhi tak yeh maloom
// karne ka koi tareeqa nahi tha. Yahan har build mein un ki fehrist nikal aati
// hai. Yeh sirf khabar hai; build nahi rukti.
const liveUrls = new Set([
  '/',
  ...alwaysOn,
  ...pages.filter((p) => p.published !== false).map((p) => p.url),
  ...contentPages.filter((c) => c.live && c.url).map((c) => c.url),
]);

const menuLinks = [];
(function collect(list, trail) {
  for (const item of list || []) {
    const where = [...trail, item.label || '?'];
    if (item.url) menuLinks.push({ url: item.url, where: where.join(' > ') });
    if (item.children) collect(item.children, where);
  }
})((() => {
  try { return JSON.parse(fs.readFileSync('src/_data/menu.json', 'utf8')).items; }
  catch { return []; }
})(), []);

const broken = menuLinks
  // sirf apni website ke pate dekhte hain - bahar ke link hamara maamla nahi
  .filter((l) => l.url.startsWith('/'))
  // sawal aur nishan hata kar sirf page ka pata rakhte hain
  .map((l) => ({ ...l, path: l.url.split('?')[0].split('#')[0] }))
  .filter((l) => l.path && !liveUrls.has(l.path))
  // Jo page jaan boojh kar chhupaya gaya hai us ka khana menu khud hata deta
  // hai - usey "toota hua" kehna fazool hai.
  .filter((l) => !hiddenUrls.includes(l.path))
  // ek hi pata kai jagah ho to ek dafa
  .filter((l, i, all) => all.findIndex((x) => x.path === l.path) === i);

const data = { pages, hidden, hiddenUrls, redirects };
const json = `${JSON.stringify(data, null, 2)}\n`;

if (!CHECK) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === json;
  if (!same) fs.writeFileSync(OUT, json, 'utf8');
}

console.log(
  `Page control: ${pages.length} pages`
  + (added.length ? `, ${added.length} naye (${added.slice(0, 3).join(', ')}${added.length > 3 ? '…' : ''})` : '')
  + (gone.length ? `, ${gone.length} hataye gaye` : '')
  + `, ${hidden.length} chhupe hue`
  + (redirects.length ? `, ${redirects.length} ka naya pata` : '')
  + (CHECK ? '  (check only, kuch nahi badla)' : '')
);
if (hidden.length) {
  for (const f of hidden.slice(0, 10)) console.log(`   chhupa hua: ${f}`);
  if (hidden.length > 10) console.log(`   …aur ${hidden.length - 10} aur`);
}

if (broken.length) {
  console.log(`\nMenu mein ${broken.length} link aise hain jo kisi page par nahi jate:`);
  for (const l of broken.slice(0, 12)) console.log(`   ${l.path.padEnd(42)} ${l.where}`);
  if (broken.length > 12) console.log(`   …aur ${broken.length - 12} aur`);
  console.log('   (Yeh sirf khabar hai - website phir bhi ban jati hai.)');
}
