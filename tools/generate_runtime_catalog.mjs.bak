import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const folders = ['tours','trekking','expeditions','jeep-safaris','hunting-services','blog','vehicles','pages'];
const items = [];
const knowledge = [];

const normalize = value => String(value ?? '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

function cleanText(value, limit = 6500) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>\[\]()]/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ').trim().slice(0, limit);
}

function arrayText(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? Object.values(item).join(' ') : item).join(' ');
  if (typeof value === 'object') return Object.values(value).join(' ');
  return String(value);
}

function boolValue(value) {
  if (typeof value === 'boolean') return value;
  return ['1','true','yes','y','on'].includes(String(value ?? '').trim().toLowerCase());
}

for (const folder of folders) {
  const dir = path.join(root, 'src', 'content', folder);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    const source = fs.readFileSync(file, 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) continue;
    const data = yaml.load(match[1]) || {};
    const body = match[2] || '';
    if (data.published === false) continue;
    const robots = String(data?.seo?.robots ?? '').toLowerCase();
    if (robots.includes('noindex')) continue;

    const tagsText = arrayText(data.tags);
    const categoriesText = arrayText(data.categories);
    const departuresText = `${arrayText(data.departures)} ${arrayText(data.departure_details)}`;
    const metadataText = [
      data.title, data.summary, data.destination, data.duration, data.difficulty,
      data.service_type, data.service_label, data?.seo?.keywords, tagsText,
      categoriesText, departuresText, arrayText(data.highlights), arrayText(data.key_facts)
    ].join(' ');
    const completeText = cleanText(`${metadataText} ${body}`);
    const normalizedText = normalize(completeText);
    const normalizedTitle = normalize(data.title);
    const normalizedSlug = normalize(String(data.permalink || '').replaceAll('/',' '));
    const normalizedTags = normalize(`${tagsText} ${categoriesText}`);
    const normalizedDestination = normalize(data.destination);
    const normalizedSummary = normalize(data.summary);
    const normalizedDepartures = normalize(departuresText);

    const fixedDeparture = boolValue(data.fixed_departure)
      || String(data.departure_type || '').toLowerCase() === 'fixed'
      || /fixed\s+departures?|scheduled\s+departures?|group\s+departures?/.test(normalize(`${metadataText} ${body}`))
      || (Array.isArray(data.departures) && data.departures.length > 0)
      || (Array.isArray(data.departure_details) && data.departure_details.length > 0);
    const bestSeller = boolValue(data.best_seller) || boolValue(data.featured)
      || /best\s*seller|bestselling|most\s+popular/.test(normalizedText);
    const k2Trek = folder === 'trekking' && /\bk2\b/.test(normalizedText);
    const culturalTour = folder === 'tours' && /cultur|heritage|histor|festival|archaeolog/.test(normalizedText);
    const peak8000 = folder === 'expeditions' && /(8\s*000|8000|8611|8126|8080|8051|8035|eight thousand)/.test(normalizedText);

    const flat = {
      title: data.title ?? '',
      url: data.permalink ?? '',
      type: folder,
      summary: data.summary ?? '',
      image: data.cover_image || data.cover_source || '/assets/uploads/placeholder.svg',
      duration: data.duration ?? '',
      price_from: data.price_from ?? '',
      destination: data.destination ?? '',
      difficulty: data.difficulty ?? '',
      group_size: data.group_size ?? '',
      fixed_departure: fixedDeparture,
      departure_type: fixedDeparture ? 'fixed' : String(data.departure_type || 'on-request'),
      best_seller: bestSeller,
      k2_trek: k2Trek,
      cultural_tour: culturalTour,
      peak_8000m: peak8000,
      normalized_title: normalizedTitle,
      normalized_slug: normalizedSlug,
      normalized_tags: normalizedTags,
      normalized_destination: normalizedDestination,
      normalized_summary: normalizedSummary,
      normalized_departures: normalizedDepartures,
      search_text: normalizedText
    };
    items.push(flat);
    knowledge.push({
      ...flat, answer_summary: data.answer_summary || data.summary || '', key_facts: data.key_facts || [],
      faqs: data.faqs || [], author: data.author || '', reviewed_by: data.reviewed_by || '',
      last_verified: String(data.last_verified || ''), excerpt: cleanText(body, 1200)
    });
  }
}

items.sort((a,b) => String(a.title).localeCompare(String(b.title)));
knowledge.sort((a,b) => String(a.title).localeCompare(String(b.title)));
const out = path.join(root, 'functions', '_data');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'catalog.js'), `export const catalog=${JSON.stringify(items)};\n`, 'utf8');
fs.writeFileSync(path.join(out, 'knowledge.js'), `export const knowledge=${JSON.stringify(knowledge)};\n`, 'utf8');
fs.writeFileSync(path.join(root, 'src', '_data', 'search-index.json'), JSON.stringify(items), 'utf8');

const structured = items.map(item => ({
  url: item.url,
  search_text: item.search_text,
  normalized_title: item.normalized_title,
  normalized_slug: item.normalized_slug,
  normalized_tags: item.normalized_tags,
  normalized_destination: item.normalized_destination,
  normalized_summary: item.normalized_summary,
  fixed_departure: item.fixed_departure,
  best_seller: item.best_seller,
  k2_trek: item.k2_trek,
  cultural_tour: item.cultural_tour,
  peak_8000m: item.peak_8000m,
  data: {
    title: item.title, permalink: item.url, service_type: item.type,
    service_label: ({tours:'Tour',trekking:'Trekking',expeditions:'Expedition','jeep-safaris':'Jeep Safari','hunting-services':'Hunting Service',blog:'Travel Guide',vehicles:'Vehicle',pages:'Destination'})[item.type] || item.type,
    summary: item.summary, cover_image: item.image, duration: item.duration,
    price_from: item.price_from, destination: item.destination, difficulty: item.difficulty,
    group_size: item.group_size, fixed_departure: item.fixed_departure,
    departure_type: item.departure_type, best_seller: item.best_seller,
    featured: item.best_seller
  }
}));
fs.writeFileSync(path.join(root, 'src', '_data', 'structuredCatalog.json'), JSON.stringify(structured), 'utf8');

const report = {
  items: items.length,
  knowledge_items: knowledge.length,
  fixed_departure_items: items.filter(item => item.fixed_departure).length,
  best_seller_items: items.filter(item => item.best_seller).length,
  k2_trek_items: items.filter(item => item.k2_trek).length,
  cultural_tour_items: items.filter(item => item.cultural_tour).length,
  peak_8000m_items: items.filter(item => item.peak_8000m).length,
  by_type: Object.fromEntries(folders.map(type => [type, items.filter(x => x.type === type).length]))
};
fs.writeFileSync(path.join(root, 'RUNTIME_CATALOG_REPORT.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(`Generated ${items.length} runtime catalogue items (${report.fixed_departure_items} fixed departures)`);
