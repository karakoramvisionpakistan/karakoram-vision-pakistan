// Khud ba khud bani file — tools/finish-seo-and-sync.mjs
// Jis section page par abhi koi journey nahi, usay Google se chhupa deti hai.
// Jaise hi entries aayein, safha khud index hone lagta hai.

const matches = (item, type, filter) => {
  if (type && item && item.data && item.data.service_type !== type) return false;
  if (!filter) return true;
  const secs = Array.isArray(item.sections) ? item.sections : [];
  if (secs.includes(filter)) return true;
  if (filter === 'fixed-departures') return !!item.fixed_departure;
  if (filter === 'best-sellers') return !!item.best_seller;
  if (filter === 'k2-treks') return !!item.k2_trek;
  if (filter === 'cultural-tours') return !!item.cultural_tour;
  if (filter === '8000m-peaks') return !!item.peak_8000m;
  return false;
};

const config = {
  eleventyComputed: {
    seo: (data) => {
      const seo = Object.assign({}, data.seo || {});
      if (!data.structured_filter) return seo;
      if (seo.robots) return seo;
      const list = Array.isArray(data.structuredCatalog) ? data.structuredCatalog : [];
      const count = list.filter((item) => matches(item, data.service_type, data.structured_filter)).length;
      // 3 se kam trips wali category Google ke liye patli hai: noindex (aur sitemap se bahar).
      // Kisi page ko hamesha index rakhna ho to front matter mein index_always: true
      if (count < (Number(data.min_journeys_to_index) || 3) && !data.index_always) seo.robots = 'noindex, follow';
      return seo;
    },
  },
};

export default config;
