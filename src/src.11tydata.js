// Hub page ka naam, taaruf aur Google wale jumle - CMS se.
//
// Yeh har page par lagta hai, magar kuch badalta sirf un pages par hai jin ka
// mawad src/content/landing/ mein mojood hai. Baqi sab pages - tours, treks,
// blog - jaise thay waise rehte hain, kyunki un ka koi landing khana nahi hai.
//
// Is tarah 26 pages ke chaar chaar khane ek hi jagah se CMS ke hawale ho jate
// hain, har page ka code alag se chhere baghair.
const forPage = (data) => (data.landing || {})[String(data.page && data.page.url || "")] || null;

export default {
  eleventyComputed: {
    title: (data) => forPage(data)?.title || data.title,
    summary: (data) => forPage(data)?.summary || data.summary,
    seo: (data) => {
      const lp = forPage(data);
      if (!lp) return data.seo;
      const seo = { ...(data.seo || {}) };
      if (lp.seo_title) seo.title = lp.seo_title;
      if (lp.seo_description) seo.description = lp.seo_description;
      return seo;
    },
  },
};
