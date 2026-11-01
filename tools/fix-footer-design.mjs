#!/usr/bin/env node
/**
 * fix-footer-design.mjs   (website ke folder mein)
 *
 * Footer ka design. SAB KUCH YA KUCH BHI NAHI.
 *
 *  A. BHAROSA WALI LINE (credentials) — us ki CSS hai hi nahi thi. Woh ek
 *     bagair style ke div hai jo footer ke do hisson ke beech beth gaya:
 *     na container, na padding, is liye kinare se tang nazar aata hai.
 *     Ab: apna container, border, aur teen alag khaane (licence / member
 *     of / registered with) ek lambi line ki jagah.
 *
 *  B. "35 years" — ab do alag baatein: 35 saal team aur purani companies
 *     ke, 2005 pehli company ka. Pehle ek hi jumle mein thay aur hisaab
 *     takra raha tha (2005 se 21 saal bante hain, 35 nahi).
 *
 *  C. SOCIAL LOGOS — contact ke khane se nikal kar "Plan & prepare" ke
 *     neechay. Ab apna component hai jo footer aur About dono par chalta
 *     hai.
 *
 *  D. HOVER — social par naam nazar aata hai (tooltip), aur footer ke
 *     SAARE links par saaf hover: rang badalta hai aur neechay lakeer
 *     aati hai, taake pata chale ke clickable hain.
 *
 *  E. AAP KA NAAM — footer ke neechay, beech mein:
 *        Designed and developed by Ibrahim Khalil
 *                  Software developer
 *     Naam par click karne se ek chhoti list khulti hai (GitHub,
 *     LinkedIn, jo bhi aap site.json / CMS mein daalein). Abhi list
 *     khaali hai, is liye naam saada likha aayega; pehla link daalte hi
 *     woh khud ba khud clickable menu ban jayega.
 *
 *  F. ABOUT KA SAFHA — wahi bharosa wali line aur clickable social logos
 *     wahan bhi.
 *
 *   node tools/fix-footer-design.mjs            -> sirf dikhana
 *   node tools/fix-footer-design.mjs --write    -> lagana
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const P = (...a) => path.join(ROOT, ...a);

const SITE   = P('src', '_data', 'site.json');
const FOOTER = P('src', '_includes', 'components', 'footer.njk');
const CRED   = P('src', '_includes', 'components', 'credentials.njk');
const SOCIAL = P('src', '_includes', 'components', 'social-links.njk');
const DEV    = P('src', '_includes', 'components', 'developer-credit.njk');
const ABOUT  = P('src', 'content', 'pages', 'about-us.md');
const CSS    = P('src', 'assets', 'css', 'input.css');

const problems = [];
const result = {};
const say = (s = '') => console.log(s);

const read = (f) => (result[f] ?? fs.readFileSync(f, 'utf8'));

/* ==================================================================== */
/* naye component                                                       */
/* ==================================================================== */

const SOCIAL_NJK = `{# Social links. Footer aur About, dono jagah yahi chalta hai.

   Har link ke andar do cheezein hain: gola jis mein nishan hai, aur naam
   jo sirf hover par upar nazar aata hai. Naam is liye ke gole dekh kar
   har koi nahi pehchanta ke kaun sa kya hai, aur yeh bhi pata chale ke
   cheez clickable hai.

   aria-label waise hi rehta hai, to screen reader ko pehle bhi naam
   milta tha aur ab bhi. #}
{% from "components/icon.njk" import icon %}
{% set f = siteFooter or {} %}
{% if f.social.enabled !== false %}
<div class="bk-social-links" aria-label="Social media accounts">
  {%- for platform in f.social.platform_order %}{% if site.social[platform.key] %}<a class="bk-social-link" href="{{ site.social[platform.key] }}" target="_blank" rel="noopener" aria-label="{{ platform.label }}"><span class="bk-social-glyph">{{ icon(platform.icon or 'chat') }}</span><span class="bk-social-name" aria-hidden="true">{{ platform.label }}</span></a>{% endif %}{% endfor -%}
  {%- for extra in site.social_extra %}{% if extra.url %}<a class="bk-social-link" href="{{ extra.url }}" target="_blank" rel="noopener" aria-label="{{ extra.label or 'Social account' }}"><span class="bk-social-glyph">{{ icon(extra.icon or 'share') }}</span><span class="bk-social-name" aria-hidden="true">{{ extra.label or 'Social' }}</span></a>{% endif %}{% endfor -%}
</div>
{% endif %}
`;

const CRED_NJK = `{# License aur membership. Muqabil yahi sab se pehle dikhata hai; yeh
   bharose ka seedha nishan hai aur Google ke E-E-A-T mein ginti mein aata hai.

   Pehle yeh ek lambi line thi aur is ki koi CSS nahi thi, is liye footer
   ke kinare se chipak kar tang nazar aati thi. Ab teen alag khaane hain,
   har ek ka apna unwan, aur neechay tajurbe ka jumla.

   Har baat alag likhi hai aur koi dawa milaya nahi gaya: tajurba team
   aur purani companies ka hai, aur 2005 pehli company ka saal hai. Dono
   alag jumle hain, is liye koi hisaab nahi takrata. #}
{% set c = site.credentials or {} %}
{% if c.show !== false and c.licence_number %}
<div class="bk-credentials">
  <div class="bk-credentials-inner">
    <dl class="bk-credentials-list">
      <div class="bk-credential">
        <dt>{{ c.licence_label or 'Government licence' }}</dt>
        <dd>{{ c.licence_number }}</dd>
      </div>
      {% if c.memberships and c.memberships.length %}
      <div class="bk-credential">
        <dt>Member of</dt>
        <dd>{{ c.memberships | join(', ') }}</dd>
      </div>
      {% endif %}
      {% if c.registered_with and c.registered_with.length %}
      <div class="bk-credential">
        <dt>Registered with</dt>
        <dd>{{ c.registered_with | join(' and ') }}</dd>
      </div>
      {% endif %}
    </dl>
    {% if c.experience_note %}<p class="bk-credentials-note">{{ c.experience_note }}</p>{% endif %}
  </div>
</div>
{% endif %}
`;

const DEV_NJK = `{# Banane wale ka naam, footer ke bilkul neechay, beech mein.

   Agar site.developer.links mein ek bhi link hai to naam ek chhota menu
   ban jata hai jo click par khulta hai (details/summary — is ke liye koi
   JavaScript nahi chahiye, aur keyboard se bhi khulta hai). Links khaali
   hon to naam saada likha aata hai.

   Naye link daalne ke liye site.json mein developer.links mein entry
   barha dein; khaali url wali entry chhor di jati hai. #}
{% set d = site.developer or {} %}
{% if d.show !== false and d.name %}
<div class="bk-devcredit">
  <p class="bk-devcredit-line">
    {%- if d.prefix %}<span class="bk-devcredit-prefix">{{ d.prefix }}</span> {% endif -%}
    {%- if d.links and d.links.length -%}
    <details class="bk-devcredit-menu">
      <summary>{{ d.name }}</summary>
      <div class="bk-devcredit-links">
        {%- for l in d.links %}{% if l.url %}<a href="{{ l.url }}" target="_blank" rel="noopener me">{{ l.label or l.url }}</a>{% endif %}{% endfor -%}
      </div>
    </details>
    {%- else -%}<span class="bk-devcredit-name">{{ d.name }}</span>{%- endif -%}
  </p>
  {% if d.role %}<p class="bk-devcredit-role">{{ d.role }}</p>{% endif %}
</div>
{% endif %}
`;

/* ==================================================================== */
/* CSS                                                                  */
/* ==================================================================== */

const CSS_MARK = '/* === Footer trust, social names, developer credit (V11.24) === */';
const CSS_BLOCK = `

${CSS_MARK}
/* Yeh hissa @layer ke baahar hai, is liye oopar likhi har cheez par bhaari
   parta hai. Wapas lena ho to poora block hata dein — baqi file jaisi hai
   waisi rahegi. */

/* ---- 1) Bharosa wali line ----------------------------------------------
   Is ki koi CSS thi hi nahi: ek nanga div footer ke do hisson ke beech.
   Ab baqi footer ki tarah container ke andar, aur teen alag khaane. */

.bk-credentials {
  border-top: 1px solid var(--bk-border, rgba(255,255,255,.12));
}
.bk-credentials-inner {
  margin-inline: auto;
  max-width: 1440px;
  padding: 1.1rem 1.5rem;
}
.bk-credentials-list {
  display: flex;
  flex-wrap: wrap;
  gap: .9rem 2.25rem;
  margin: 0;
}
.bk-credential dt {
  margin: 0;
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: .6;
}
.bk-credential dd {
  margin: .15rem 0 0;
  font-size: .9rem;
  font-weight: 600;
  color: #fff;
}
.bk-credentials-note {
  margin: .75rem 0 0 !important;
  max-width: 62ch;
  font-size: .8rem !important;
  line-height: 1.55 !important;
  opacity: .72;
}

/* ---- 2) Social: gola wahi, naam hover par ------------------------------
   Gole ka naap nahi badla. Naam upar tairta hai aur sirf hover ya keyboard
   focus par nazar aata hai. Chhoti screen par hover hota hi nahi, is liye
   wahan naam chhupa rehta hai aur aria-label apna kaam karta hai. */

.bk-social-links { position: relative; }
.bk-social-link { position: relative; }
.bk-social-name {
  position: absolute;
  bottom: calc(100% + .45rem);
  left: 50%;
  transform: translate(-50%, .2rem);
  padding: .2rem .5rem;
  border-radius: 6px;
  background: var(--bk-accent, #ff5a1f);
  color: #fff;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .02em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .18s ease, transform .18s ease;
}
.bk-social-link:hover .bk-social-name,
.bk-social-link:focus-visible .bk-social-name {
  opacity: 1;
  transform: translate(-50%, 0);
}
@media (hover: none) {
  .bk-social-name { display: none; }
}

/* ---- 3) Har link par saaf hover ---------------------------------------
   Pehle sirf rang badalta tha. Rang akela kaafi nahi — lakeer se foran
   pata chalta hai ke cheez clickable hai. */

.bk-footer-links a,
.bk-footer-bottom nav a,
.bk-footer section > a {
  text-decoration: none;
  text-underline-offset: .28em;
  text-decoration-thickness: 1px;
  transition: color .18s ease, text-decoration-color .18s ease;
}
.bk-footer-links a:hover,
.bk-footer-links a:focus-visible,
.bk-footer-bottom nav a:hover,
.bk-footer-bottom nav a:focus-visible,
.bk-footer section > a:hover,
.bk-footer section > a:focus-visible {
  color: var(--bk-accent, #ff5a1f);
  text-decoration: underline;
}
.bk-footer p a:hover,
.bk-footer p a:focus-visible {
  text-decoration: underline;
  text-underline-offset: .22em;
}

/* Social column ko links ke neechay thori jagah */
.bk-footer-links .bk-social-links { margin-top: 1.1rem; }

/* ---- 4) Banane wale ka naam -------------------------------------------- */

.bk-devcredit {
  border-top: 1px solid var(--bk-border, rgba(255,255,255,.12));
  padding: .85rem 1.5rem 1.1rem;
  text-align: center;
}
.bk-devcredit-line {
  margin: 0 !important;
  font-size: .8rem !important;
  line-height: 1.5 !important;
}
.bk-devcredit-prefix { opacity: .72; }
.bk-devcredit-name { font-weight: 700; color: #fff; }
.bk-devcredit-role {
  margin: .1rem 0 0 !important;
  font-size: .7rem !important;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: .55;
}

/* Naam ka menu: details/summary, bagair JavaScript ke */
.bk-devcredit-menu { position: relative; display: inline-block; }
.bk-devcredit-menu > summary {
  display: inline;
  cursor: pointer;
  list-style: none;
  font-weight: 700;
  color: #fff;
  text-decoration: underline;
  text-underline-offset: .28em;
  text-decoration-color: var(--bk-accent, #ff5a1f);
}
.bk-devcredit-menu > summary::-webkit-details-marker { display: none; }
.bk-devcredit-menu > summary:hover,
.bk-devcredit-menu > summary:focus-visible { color: var(--bk-accent, #ff5a1f); }
.bk-devcredit-links {
  position: absolute;
  bottom: calc(100% + .5rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: grid;
  gap: .1rem;
  min-width: 10rem;
  padding: .4rem;
  border: 1px solid var(--bk-border, rgba(255,255,255,.14));
  border-radius: 10px;
  background: #0b1220;
  box-shadow: 0 12px 28px rgba(0,0,0,.4);
}
.bk-devcredit-links a {
  padding: .4rem .6rem;
  border-radius: 6px;
  font-size: .8rem;
  text-align: left;
}
.bk-devcredit-links a:hover,
.bk-devcredit-links a:focus-visible {
  background: rgba(255,255,255,.08);
  color: var(--bk-accent, #ff5a1f);
}

/* ---- 5) About ke safhe par wahi do cheezein ---------------------------
   Wahan background safed hai, is liye rang ulat diye gaye hain. Markup
   wahi hai; sirf rang badle hain. */

.bk-about-trust {
  max-width: 80rem;
  margin: 2.5rem auto 0;
  padding: 1.5rem 1rem 0;
  border-top: 1px solid #e2e8f0;
}
.bk-about-trust > h2 {
  margin: 0 0 .9rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-navy-900, #062a72);
}
.bk-about-trust > h2 + * { margin-top: 0; }
.bk-about-trust .bk-credentials { border-top: 0; }
.bk-about-trust .bk-credentials-inner { padding: 0; max-width: none; }
.bk-about-trust .bk-credential dt { color: #475569; opacity: 1; }
.bk-about-trust .bk-credential dd { color: #0f172a; }
.bk-about-trust .bk-credentials-note { color: #475569; opacity: 1; }
.bk-about-trust .bk-social-links { margin-top: .5rem; margin-bottom: 1.5rem; }
.bk-about-trust .bk-social-link {
  border: 1px solid #cbd5e1 !important;
  background: #f8fafc !important;
  color: #0f172a !important;
}
.bk-about-trust .bk-social-link:hover {
  border-color: var(--bk-accent, #ff5a1f) !important;
  background: var(--bk-accent, #ff5a1f) !important;
  color: #fff !important;
}
/* === V11.24 END === */
`;

/* ==================================================================== */
/* kaam                                                                 */
/* ==================================================================== */

say('\nFOOTER KA DESIGN');
say('='.repeat(80));
say('   Sab kuch ya kuch bhi nahi: ek masla bhi ho to koi file nahi likhti.\n');

/* ---- A. site.json ---- */
say('A. src/_data/site.json');
say('-'.repeat(80));
{
  if (!fs.existsSync(SITE)) { say('   XX  file nahi mili'); problems.push('site.json'); }
  else {
    let d;
    try { d = JSON.parse(fs.readFileSync(SITE, 'utf8')); }
    catch (e) { say('   XX  JSON parh nahi saki: ' + e.message); problems.push('site.json parse'); d = null; }
    if (d) {
      const oldNote = (d.credentials || {}).experience_note || '';
      const newNote = 'Our team and the companies behind it bring more than 35 years of Pakistan tourism experience; the first of those companies was registered in 2005.';
      if (oldNote !== newNote) {
        say('   experience_note:');
        say('      pehle: ' + (oldNote || '[khaali]'));
        say('      ab:    ' + newNote);
        d.credentials = d.credentials || {};
        d.credentials.experience_note = newNote;
      } else say('   experience_note pehle se theek hai');

      if (!d.developer) {
        d.developer = {
          show: true,
          prefix: 'Designed and developed by',
          name: 'Ibrahim Khalil',
          role: 'Software developer',
          links: [],
        };
        say('   developer: naya khaana banaya (links khaali — aap bharein)');
      } else say('   developer ka khaana pehle se mojood hai, chhora');

      result[SITE] = JSON.stringify(d, null, 2) + '\n';
    }
  }
}

/* ---- B. naye component ---- */
say('');
say('B. NAYE COMPONENT');
say('-'.repeat(80));
for (const [f, body, label] of [[SOCIAL, SOCIAL_NJK, 'social-links.njk'], [DEV, DEV_NJK, 'developer-credit.njk']]) {
  say('   ' + (fs.existsSync(f) ? 'badla:  ' : 'naya:   ') + 'components/' + label + '   (' + body.length + ' harf)');
  result[f] = body;
}
if (!fs.existsSync(CRED)) { say('   XX  credentials.njk nahi mili'); problems.push('credentials.njk'); }
else { say('   badla:  components/credentials.njk   (' + CRED_NJK.length + ' harf)'); result[CRED] = CRED_NJK; }

/* ---- C. footer.njk ---- */
say('');
say('C. src/_includes/components/footer.njk');
say('-'.repeat(80));
{
  if (!fs.existsSync(FOOTER)) { say('   XX  file nahi mili'); problems.push('footer.njk'); }
  else {
    let t = read(FOOTER);

    const OLD_SOCIAL = `      {% if f.social.enabled !== false %}
      <div class="bk-social-links" aria-label="Social media accounts">
        {% for platform in f.social.platform_order %}{% if site.social[platform.key] %}<a href="{{ site.social[platform.key] }}" target="_blank" rel="noopener" aria-label="{{ platform.label }}">{{ icon(platform.icon or 'chat') }}</a>{% endif %}{% endfor %}
        {% for extra in site.social_extra %}{% if extra.url %}<a href="{{ extra.url }}" target="_blank" rel="noopener" aria-label="{{ extra.label or 'Social account' }}">{{ icon(extra.icon or 'share') }}</a>{% endif %}{% endfor %}
      </div>
      {% endif %}
`;
    const OLD_COLS = `    {% for column in f.columns %}
    <section class="bk-footer-links">
      <h2>{{ column.heading }}</h2>
      {% for link in column.links %}{% if link.enabled !== false %}<a href="{{ link.url }}"{% if link.target_blank %} target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a>{% endif %}{% endfor %}
    </section>
    {% endfor %}`;
    const NEW_COLS = `    {% for column in f.columns %}
    {% set isLastColumn = loop.last %}
    <section class="bk-footer-links">
      <h2>{{ column.heading }}</h2>
      {% for link in column.links %}{% if link.enabled !== false %}<a href="{{ link.url }}"{% if link.target_blank %} target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a>{% endif %}{% endfor %}
      {# Social logos ab yahan, contact ke khane ki jagah. #}
      {% if isLastColumn %}{% include "components/social-links.njk" %}{% endif %}
    </section>
    {% endfor %}`;
    const OLD_END = `  </div>
</footer>`;
    /* Include band hone wale div ke BAAD aata hai, andar nahi: bk-footer-bottom
       ek flex row hai, us ke andar beech mein kuch nahi aa sakta. */
    const NEW_END = `  </div>
  {% include "components/developer-credit.njk" %}
</footer>`;

    let ok = true;
    if (t.includes('components/social-links.njk')) say('   -- pehle se laga hua hai, chhora');
    else {
      for (const [name, oldS, newS] of [
        ['social logos hataye (contact ke khane se)', OLD_SOCIAL, ''],
        ['social logos "Plan & prepare" ke neechay', OLD_COLS, NEW_COLS],
      ]) {
        const n = t.split(oldS).length - 1;
        if (n !== 1) { say('   XX  "' + name + '": ' + n + ' jagah mila, ek chahiye'); problems.push('footer: ' + name); ok = false; continue; }
        t = t.split(oldS).join(newS);
        say('   OK  ' + name);
      }
      const n = t.split(OLD_END).length - 1;
      if (n !== 1) { say('   XX  footer ka ikhtitaam nahi mila (' + n + ')'); problems.push('footer: end'); ok = false; }
      else { t = t.split(OLD_END).join(NEW_END); say('   OK  banane wale ka naam footer ke neechay'); }
      if (ok) result[FOOTER] = t;
    }
  }
}

/* ---- D. about-us.md ---- */
say('');
say('D. src/content/pages/about-us.md');
say('-'.repeat(80));
{
  if (!fs.existsSync(ABOUT)) { say('   XX  file nahi mili'); problems.push('about-us.md'); }
  else {
    const t = read(ABOUT);
    if (t.includes('bk-about-trust')) say('   -- pehle se laga hua hai, chhora');
    else {
      const add = `
<section class="bk-about-trust">
  <h2>Licensed and registered</h2>
  {% include "components/credentials.njk" %}
  <h2>Follow Karakoram Vision</h2>
  {% include "components/social-links.njk" %}
</section>
`;
      result[ABOUT] = t.replace(/\s*$/, '\n') + add;
      say('   OK  bharosa wali line aur clickable social logos aakhir mein');
      say('       (yeh safha njk se guzarta hai, is liye include chalta hai)');
    }
  }
}

/* ---- E. CSS ---- */
say('');
say('E. src/assets/css/input.css');
say('-'.repeat(80));
{
  if (!fs.existsSync(CSS)) { say('   XX  file nahi mili'); problems.push('input.css'); }
  else {
    const t = read(CSS);
    if (t.includes(CSS_MARK)) say('   -- V11.24 pehle se laga hua hai, chhora');
    else { result[CSS] = t.replace(/\s*$/, '\n') + CSS_BLOCK; say('   OK  V11.24 block aakhir mein (' + CSS_BLOCK.length + ' harf)'); }
  }
}

/* ---- faisla ---- */

say('');
say('='.repeat(80));
if (problems.length) {
  say('XX XX XX  ' + problems.length + ' masle — KOI FILE NAHI LIKHI:');
  for (const m of problems) say('          ' + m);
  say('');
  say('   Yeh list mujhe bhej dein, badal dunga.');
  process.exit(1);
}
say('   Sab theek. Files badlengi: ' + Object.keys(result).length);
say('');
say('   AAP KE FAISLE KI BAATEIN:');
say('      1. Aap ka naam abhi saada likha aayega, link ke bagair — kyunki');
say('         site.json mein developer.links khaali hai. Pehla link daalte hi');
say('         naam khud ba khud clickable menu ban jayega. Ek se zyada link');
say('         daalein to sab us menu mein aayenge.');
say('      2. "35 years" ab do alag jumlon mein hai: tajurba team aur purani');
say('         companies ka, aur 2005 pehli company ka saal. Pehle ek hi jumle');
say('         mein thay aur 2005 se 35 saal nahi bante.');
say('      3. site.json mein "founded_year": "2007" likha hai, magar credentials');
say('         2005 kehti hai. Yeh maine NAHI chhua — batayein kaun sa sahi hai.');
say('');

if (!WRITE) {
  say('Lagane ke liye:');
  say('   node tools/fix-footer-design.mjs --write');
  process.exit(0);
}

for (const [f, text] of Object.entries(result)) {
  const existed = fs.existsSync(f);
  if (existed && !fs.existsSync(f + '.bakdesign')) fs.copyFileSync(f, f + '.bakdesign');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text, 'utf8');
  say((existed ? 'LIKHA: ' : 'BANAYA: ') + path.relative(ROOT, f).split(path.sep).join('/'));
}
say('');
say(Object.keys(result).length + ' files. backup: *.bakdesign');
say('');
say('Agla qadam:  npm run build');
say('Phir browser mein footer aur /about-us/ dekh lein.');
