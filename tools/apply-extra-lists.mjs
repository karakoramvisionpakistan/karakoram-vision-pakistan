// Client khud naye social accounts aur chat channels add/remove kar sake.
//
// Maujooda 11 social aur 14 chat channels jaise hain waise rehte hain. Un ke
// neeche ek list aa jati hai jahan client jitne chahe naye add kar sakta hai -
// icon chun kar, naam aur link likh kar. Website dono ko ek saath dikhati hai.
//
// Saath ek purani galti bhi theek hoti hai: footer mein social icons ke baad
// email ka icon hamesha aa jata tha (Nunjucks mein loop ke andar set kiya hua
// variable loop ke bahar nazar nahi aata), ab woh sirf tab aata hai jab koi
// social account na ho.
//
//   node tools/apply-extra-lists.mjs           -> sirf dikhata hai
//   node tools/apply-extra-lists.mjs --write   -> files badal deta hai
// Dobara chalane par kuch duplicate nahi hota.
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
let changed = 0, skipped = 0, problems = 0;

const SOCIAL_ICONS = ['facebook', 'instagram', 'youtube', 'linkedin', 'tripadvisor',
  'x', 'tiktok', 'pinterest', 'threads', 'google', 'chat', 'share', 'mail'];
const CHAT_ICONS = ['whatsapp', 'telegram', 'messenger', 'signal', 'skype', 'line',
  'wechat', 'viber', 'kakao', 'zalo', 'imo', 'vk', 'max', 'chat', 'mail', 'phone'];

function patch(file, label, fn) {
  if (!fs.existsSync(file)) { console.log(`MISSING FILE  ${file}`); problems++; return; }
  const before = fs.readFileSync(file, 'utf8');
  let after;
  try { after = fn(before); } catch (e) { console.log(`!! ${label}\n   ${e.message}`); problems++; return; }
  if (after === null) { console.log(`   pehle se theek: ${label}`); skipped++; return; }
  if (after === before) { console.log(`   koi tabdeeli nahi: ${label}`); skipped++; return; }
  console.log(`${WRITE ? 'badla' : 'badlega'}: ${label}  (${file})`);
  changed++;
  if (WRITE) fs.writeFileSync(file, after, 'utf8');
}

const nlOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

// ---------------------------------------------------------------- 1. .pages.yml
patch('.pages.yml', 'CMS: naye social aur chat channel add karne ki lists', (text) => {
  if (text.includes('- name: social_extra')) return null;

  const nl = nlOf(text);
  const lines = text.split(/\r?\n/);

  // top-level entries
  const starts = [];
  lines.forEach((l, i) => { if (/^- name: \S/.test(l)) starts.push(i); });
  const entries = starts.map((s, k) => ({
    name: lines[s].replace(/^- name:\s*/, '').trim(),
    start: s,
    end: k + 1 < starts.length ? starts[k + 1] : lines.length,
  }));
  const byName = Object.fromEntries(entries.map((e) => [e.name, e]));

  // kis screen ke aakhir mein list jorni hai
  const target = (screen, fallbackField) => {
    const e = byName[screen];
    if (e) return e;
    // screens abhi tak alag nahi hui hon to "site" wali screen mein daal dete hain
    const site = byName.site;
    if (!site) throw new Error(`.pages.yml mein "${screen}" aur "site" dono nahi mile`);
    if (!text.includes(`  - name: ${fallbackField}`)) {
      throw new Error(`.pages.yml mein "${fallbackField}" ka khana nahi mila`);
    }
    return site;
  };

  // entry ke `fields:` ke aakhri block ka end nikalna
  const endOfFields = (entry) => {
    let fieldsAt = -1;
    for (let i = entry.start; i < entry.end; i++) {
      if (/^  fields:\s*$/.test(lines[i])) { fieldsAt = i; break; }
    }
    if (fieldsAt === -1) throw new Error(`"${entry.name}" mein fields: nahi mila`);
    let last = fieldsAt + 1;
    for (let i = fieldsAt + 1; i < entry.end; i++) {
      if (/^\S/.test(lines[i])) break;
      if (lines[i].trim() !== '') last = i + 1;
    }
    return last;
  };

  const selectBlock = (name, label, options, indent = '    ') => [
    `${indent}- name: ${name}`,
    `${indent}  label: ${JSON.stringify(label)}`,
    `${indent}  type: select`,
    `${indent}  options:`,
    ...options.map((o) => `${indent}  - ${o}`),
  ];
  const strBlock = (name, label, desc, indent = '    ') => {
    const out = [
      `${indent}- name: ${name}`,
      `${indent}  label: ${JSON.stringify(label)}`,
      `${indent}  type: string`,
    ];
    if (desc) out.push(`${indent}  description: ${JSON.stringify(desc)}`);
    return out;
  };

  const socialBlock = [
    '  - name: social_extra',
    '    label: More social accounts — add as many as you like',
    '    type: object',
    '    list: true',
    '    description: "Jo platform oopar ki list mein nahi hai, usey yahan add karein. Hatane ke liye us row ka X dabayein."',
    '    fields:',
    ...selectBlock('icon', 'Icon', SOCIAL_ICONS),
    ...strBlock('label', 'Name', 'Jaise "Snapchat". Yeh screen reader aur hover par nazar aata hai.'),
    ...strBlock('url', 'Link', 'Poora link, https:// ke saath.'),
  ];

  const chatBlock = [
    '  - name: contact_extra',
    '    label: More chat channels — add as many as you like',
    '    type: object',
    '    list: true',
    '    description: "Jo app oopar ki list mein nahi hai, usey yahan add karein. Hatane ke liye us row ka X dabayein."',
    '    fields:',
    ...selectBlock('icon', 'Icon', CHAT_ICONS),
    ...strBlock('label', 'Name', 'Jaise "Discord" ya "Botim".'),
    ...strBlock('note', 'Small text under the name', 'Ikhtiyari - jaise "Middle East" ya "Calls only".'),
    ...strBlock('url', 'Link', 'Poora link. Agar sirf ID copy karani ho to yeh khali chhor dein.'),
    ...strBlock('copy_text', 'Or an ID to copy', 'Link ke bajaye ID/number - visitor click kar ke copy kar lega.'),
  ];

  const socialAt = endOfFields(target('site_social', 'social'));
  const chatAt = endOfFields(target('site_channels', 'contact'));

  // peeche se aage daalein, taake line numbers na hilen
  const inserts = [
    { at: socialAt, block: socialBlock },
    { at: chatAt, block: chatBlock },
  ].sort((a, b) => b.at - a.at);
  for (const i of inserts) lines.splice(i.at, 0, ...i.block);

  return lines.join(nl);
});

// ---------------------------------------------------------------- 2. site.json
patch('src/_data/site.json', 'Site data: khali lists banana', (text) => {
  const data = JSON.parse(text);
  if (Array.isArray(data.social_extra) && Array.isArray(data.contact_extra)) return null;

  const out = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = v;
    if (k === 'social' && !Array.isArray(data.social_extra)) out.social_extra = [];
    if (k === 'contact' && !Array.isArray(data.contact_extra)) out.contact_extra = [];
  }
  if (!Array.isArray(out.social_extra)) out.social_extra = [];
  if (!Array.isArray(out.contact_extra)) out.contact_extra = [];

  return JSON.stringify(out, null, 2) + nlOf(text);
});

// ---------------------------------------------------------------- 3. footer
patch('src/_includes/components/footer.njk', 'Footer: naye social accounts bhi dikhein', (text) => {
  if (text.includes('site.social_extra')) return null;

  const old = text.match(/\{% set shownSocial = false %\}[\s\S]*?\{% if not shownSocial %\}[\s\S]*?\{% endif %\}/);
  if (!old) throw new Error('footer.njk mein social icons wala hissa nahi mila');

  // Purana code loop ke andar `shownSocial` set karta tha. Nunjucks mein loop ke
  // andar ki value loop ke bahar nazar nahi aati, is liye email ka icon hamesha
  // aa jata tha. Ab flag ki zarurat hi nahi - do saaf loops.
  const neu = [
    '{% for platform in f.social.platform_order %}{% if site.social[platform.key] %}'
      + '<a href="{{ site.social[platform.key] }}" target="_blank" rel="noopener"'
      + " aria-label=\"{{ platform.label }}\">{{ icon(platform.icon or 'chat') }}</a>"
      + '{% endif %}{% endfor %}',
    '        {% for extra in site.social_extra %}{% if extra.url %}'
      + '<a href="{{ extra.url }}" target="_blank" rel="noopener"'
      + " aria-label=\"{{ extra.label or 'Social account' }}\">{{ icon(extra.icon or 'share') }}</a>"
      + '{% endif %}{% endfor %}',
  ].join(nlOf(text));

  return text.replace(old[0], neu);
});

// ---------------------------------------------------------------- 4. contact modal
patch('src/_includes/components/contact-modal.njk', 'Contact modal: naye chat channels ka hissa', (text) => {
  if (text.includes('contact_extra')) return null;

  const marker = '<div class="bk-contact-modal-actions">';
  if (!text.includes(marker)) throw new Error('contact-modal.njk mein actions wala hissa nahi mila');
  const nl = nlOf(text);

  const block = [
    '    {% if site.contact_extra and site.contact_extra.length %}',
    '    <section class="bk-contact-group" aria-labelledby="contact-extra">',
    '      <h3 id="contact-extra">More ways to reach us</h3>',
    '      <div class="bk-contact-app-grid">',
    '        {% for c in site.contact_extra %}'
      + '{% if c.copy_text %}<button class="bk-contact-app-card" type="button" data-copy-text="{{ c.copy_text }}">'
      + "{{ icon(c.icon or 'chat') }}<span><strong>{{ c.label }}</strong>"
      + '<small>{{ c.note or c.copy_text }}</small></span></button>'
      + '{% elif c.url %}<a class="bk-contact-app-card" href="{{ c.url }}" target="_blank" rel="noopener">'
      + "{{ icon(c.icon or 'chat') }}<span><strong>{{ c.label }}</strong>"
      + '{% if c.note %}<small>{{ c.note }}</small>{% endif %}</span></a>'
      + '{% endif %}{% endfor %}',
    '      </div>',
    '    </section>',
    '    {% endif %}',
    '',
    `    ${marker}`,
  ].join(nl);

  return text.replace(`    ${marker}`, block);
});

console.log(`\n${changed} ${WRITE ? 'tabdeeliyan ho gayin' : 'tabdeeliyan hongi'}, ${skipped} pehle se theek, ${problems} problem.`);
if (!WRITE && changed) console.log('Abhi kuch change nahi hua. Apply karne ke liye --write ke saath chalayein.');
