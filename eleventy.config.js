import { readFileSync as __readFileForSizes } from "node:fs";
export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"src/assets":"assets"});
  eleventyConfig.addPassthroughCopy({"src/_headers":"_headers"});
  eleventyConfig.addPassthroughCopy({"src/_redirects":"_redirects"});
  eleventyConfig.addPassthroughCopy({"src/_routes.json":"_routes.json"});
  eleventyConfig.addPassthroughCopy({"src/sw.js":"sw.js"});
  const published = x => x.data.published !== false;
  const coll = (api, folder) => api.getFilteredByGlob(`src/content/${folder}/*.md`).filter(published);
  eleventyConfig.addCollection("tours", api => coll(api,"tours"));
  eleventyConfig.addCollection("trekking", api => coll(api,"trekking"));
  eleventyConfig.addCollection("expeditions", api => coll(api,"expeditions"));
  eleventyConfig.addCollection("jeepSafaris", api => coll(api,"jeep-safaris"));
  eleventyConfig.addCollection("huntingServices", api => coll(api,"hunting-services"));
  eleventyConfig.addCollection("journeys", api => ["tours","trekking","expeditions","jeep-safaris","hunting-services"].flatMap(x=>coll(api,x)));
  eleventyConfig.addCollection("posts", api => coll(api,"blog"));
  eleventyConfig.addCollection("vehicles", api => coll(api,"vehicles"));
  eleventyConfig.addCollection("pages", api => coll(api,"pages"));
  eleventyConfig.addCollection("sliders", api => coll(api,"sliders"));
  // Kisi section ki slides nikalta hai. "all" wali slides har jagah aati hain.
  eleventyConfig.addFilter("slidesFor", (sliders, section) => {
    const key = String(section || "homepage").toLowerCase();
    const of = item => [].concat(item.data.sections || item.data.section || [])
      .map(x => String(x || "").toLowerCase()).filter(Boolean);
    return (sliders || [])
      .filter(item => { const s = of(item); return s.includes(key) || s.includes("all"); })
      .sort((a,b) => (Number(a.data.order||0) - Number(b.data.order||0))
        || String(a.data.title||"").localeCompare(String(b.data.title||"")))
      .slice(0, 12);
  });
  eleventyConfig.addCollection("indexable", api => api.getAll().filter(x => x.data.published !== false && x.url && !(String((x.data.seo || {}).robots || "").toLowerCase().includes("noindex")) && x.url !== "/404.html"));
  // Page ke URL se banner ki setting ka naam: "/" -> homepage,
  // "/tours/" aur "/tours/fixed-departures/" dono -> tours.
  eleventyConfig.addFilter("heroKey", url => {
    const first = String(url || "/").split("/").filter(Boolean)[0];
    return first ? first.toLowerCase() : "homepage";
  });
  // Us page ki banner setting. Purani shakal (sirf true/false) bhi chalti hai.
  eleventyConfig.addFilter("heroConfig", (settings, key) => {
    const raw = (settings || {})[key];
    if (raw === undefined || raw === null) return { enabled: true, image: "", image_alt: "" };
    if (typeof raw === "boolean") return { enabled: raw, image: "", image_alt: "" };
    return { enabled: raw.enabled !== false, image: raw.image || "", image_alt: raw.image_alt || "" };
  });
  // Banner ki photo ke liye har shakal ka srcset. tools/hero-crops.mjs ne jo
  // katai banai hai, yeh us ki fehrist (src/_data/heroImages.json) mein se us
  // photo ka hissa nikal kar deta hai. Kuch na mile to null - template phir
  // asli photo laga deta hai, to kuch toota nahi.
  eleventyConfig.addFilter("heroPicture", (images, imagePath) => {
    const entry = (images || {})[String(imagePath || "").trim()];
    if (!entry) return null;
    const line = (list) => (list || []).map(v => `${v.src} ${v.w}w`).join(", ");
    const wide = entry.wide || [];
    const big = wide[wide.length - 1];
    if (!big) return null;
    return {
      wide: line(entry.wide), mid: line(entry.mid), tall: line(entry.tall),
      fallback: big.src, w: big.w, h: big.h,
    };
  });
  // Har photo ke naap ki fehrist - tools/image-sizes.mjs build ke waqt banata
  // hai. Yahan ek dafa parh lete hain taake har <img> ko alag se dena na pare.
  const __imageSizes = (() => {
    try { return JSON.parse(__readFileForSizes("src/_data/imageSizes.json", "utf8")); }
    catch { return {}; }
  })();
  // Photo ka pata do, srcset aur sizes wapas milte hain. Naap na bane hon to
  // khali - us surat mein <img> waisa hi rehta hai jaisa pehle tha.
  eleventyConfig.addFilter("srcsetAttr", (imagePath, sizes) => {
    const list = __imageSizes[String(imagePath || "").trim()];
    if (!list || list.length < 2) return "";
    const srcset = list.map(v => `${v.src} ${v.w}w`).join(", ");
    return ` srcset="${srcset}" sizes="${sizes || "100vw"}"`;
  });
  // Jo pages CMS se chhupaye gaye hain unhein build hi mat karo. Yeh sirf
  // menu se hatana nahi - page banta hi nahi, is liye na us ka address
  // khulta hai, na woh sitemap ya search mein aata hai, aur Google ko bhi
  // nazar nahi aata. Fehrist tools/page-control.mjs banata hai, build ke
  // shuru mein. Fehrist na mile to sab pages pehle ki tarah chalte hain.
  try {
    const control = JSON.parse(__readFileForSizes("src/_data/pageControl.json", "utf8"));
    for (const file of control.hidden || []) eleventyConfig.ignores.add(file);
  } catch {
    // koi baat nahi
  }
  // Menu mein se un khanon ko nikal deta hai jin ke page chhupaye gaye hain.
  // menu.json mein kuch nahi badalta - khana wahin likha rehta hai, bas dikhta
  // nahi. Page wapas chalu karte hi link bhi lout aata hai.
  const __hiddenUrls = (() => {
    try {
      const c = JSON.parse(__readFileForSizes("src/_data/pageControl.json", "utf8"));
      return new Set(c.hiddenUrls || []);
    } catch { return new Set(); }
  })();
  eleventyConfig.addFilter("liveMenu", function liveMenu(items) {
    return (items || []).map((item) => {
      const kids = item.children ? liveMenu(item.children) : null;
      const dead = item.url && __hiddenUrls.has(item.url);
      // Page bhi chhupa hua aur andar bhi kuch nahi bacha - poora khana hata do
      if (dead && (!kids || !kids.length)) return null;
      const out = { ...item };
      if (dead) delete out.url;            // khana rehta hai, click nahi hota
      if (kids) { if (kids.length) out.children = kids; else delete out.children; }
      return out;
    }).filter(Boolean);
  });
  // Hub pages ka mawad CMS mein hai: src/content/landing/ ki files.
  // Woh khud koi page nahi bantin - sirf mawad hain - is liye build se
  // bahar. Unhein src/_data/landing.js parh kar templates tak pohanchata hai.
  eleventyConfig.ignores.add("src/content/landing/*.md");
  // Card ki list mein se woh card nikal deta hai jo chhupaye gaye hain.
  eleventyConfig.addFilter("liveCards", (arr) => (arr || []).filter(c => c && c.enabled !== false));
  // Trips whose "Fixed departure" switch is on. Pehle yeh row alfaz
  // dhoondti thi ("fixed departure" likha hua ho) - us se koi trip reh
  // jata tha aur koi galti se aa jata tha. Ab switch hi faisla karta hai.
  eleventyConfig.addFilter("fixedDepartures", (arr) => (arr || []).filter(i => i && i.data && i.data.fixed_departure === true));
  eleventyConfig.addFilter("json", v => JSON.stringify(v));
  eleventyConfig.addFilter("limit", (arr,n) => (arr || []).slice(0,n));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addFilter("isoDate", value => { if(!value)return ""; const d=value instanceof Date?value:new Date(value); return Number.isNaN(d.getTime())?"":d.toISOString(); });
  eleventyConfig.addFilter("absoluteUrl", (value,base) => { const v=String(value||"").trim(); if(!v)return ""; if(/^https?:\/\//i.test(v))return v; return String(base||"").replace(/\/$/,"")+"/"+v.replace(/^\//,""); });
  eleventyConfig.addFilter("stripHtml", value => String(value||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim());
  eleventyConfig.addFilter("urlencode", value => encodeURIComponent(String(value || "")));
  eleventyConfig.addFilter("keywordItems", (arr, keywords) => {
    const terms = String(keywords || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
    if (!terms.length) return arr || [];
    return (arr || []).filter(item => {
      const data = item?.data || {};
      const haystack = [data.title, data.summary, data.destination, data.service_label, ...(data.categories || [])].filter(Boolean).join(" ").toLowerCase();
      return terms.some(term => haystack.includes(term));
    });
  });
  eleventyConfig.addFilter("safeMedia", (localValue,legacyValue,fallback="/assets/uploads/placeholder.svg") => {
    const local=String(localValue||"").trim();
    const legacy=String(legacyValue||"").trim();
    const allowed=value => value && !/apricottours\.pk/i.test(value) && !/apricot[-_ ]?tours/i.test(value) && !/beyondkarakoram\.com/i.test(value) && !/beyond[-_ ]?karakoram/i.test(value);
    if(allowed(local)) return local;
    if(allowed(legacy)) return legacy;
    return fallback;
  });
  eleventyConfig.addTransform("production-html-integrity", function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const humanizeImageName = src => {
      try { const file=decodeURIComponent(String(src||"").split("?")[0].split("/").pop()||""); const stem=file.replace(/\.[a-z0-9]+$/i,"").replace(/-\d+x\d+$/i,""); const words=stem.replace(/[_-]+/g," ").replace(/\b(?:img|image|dsc|photo)\b/gi," ").replace(/\s+/g," ").trim(); return words?words.replace(/\b\w/g,c=>c.toUpperCase()):"Karakoram Vision Pakistan travel image"; } catch { return "Karakoram Vision Pakistan travel image"; }
    };
    content = content.replace(/Apricot\s+Tours/gi,"Karakoram Vision Pakistan");
    content = content.replace(/(<img\b[^>]*\bsrc=["'])https?:\/\/(?:www\.)?apricottours\.pk\/[^"']*(["'])/gi,"$1/assets/uploads/placeholder.svg$2");
    content = content.replace(/\s+srcset=["'][^"']*apricottours\.pk[^"']*["']/gi,"");
    content = content.replace(/<img\b[^>]*>/gi, tag => {
      const src=(tag.match(/\bsrc=["']([^"']+)["']/i)||[])[1]||""; const isPriority=/\bfetchpriority=["']high["']/i.test(tag); const altMatch=tag.match(/\balt\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/i); const generatedAlt=humanizeImageName(src).replace(/"/g,'&quot;');
      if(!altMatch)tag=tag.replace(/<img\b/i,`<img alt="${generatedAlt}"`); else if(!String(altMatch[1]||altMatch[2]||"").trim())tag=tag.replace(/\balt\s*=\s*(?:["'][^"']*["']|[^\s>]+)/i,`alt="${generatedAlt}"`);
      if(!/\bwidth=["']?\d+/i.test(tag))tag=tag.replace(/<img\b/i,'<img width="1200"');
      if(!/\bheight=["']?\d+/i.test(tag))tag=tag.replace(/<img\b/i,'<img height="800"');
      if(!/\bdecoding=/i.test(tag))tag=tag.replace(/<img\b/i,'<img decoding="async"');
      if(!isPriority&&!/\bloading=/i.test(tag))tag=tag.replace(/<img\b/i,'<img loading="lazy"');
      return tag;
    });
    content=content.replace(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi,(m,attrs)=>/\brel=/i.test(attrs)?m:`<a${attrs} rel="noopener noreferrer">`);
    return content;
  });
  eleventyConfig.addFilter("serviceCollection", (collections,type) => { const map={"tours":"tours","trekking":"trekking","expeditions":"expeditions","jeep-safaris":"jeepSafaris","hunting-services":"huntingServices"}; return collections[map[type]]||[]; });
  eleventyConfig.addFilter("menuWithJourneys", (items, catalog, sections, limit) => {
    // Section ke neeche uski journeys khud juR jaati hain.
    const max = Number(limit) || 8;
    const norm = (value) => {
      let s = String(value || "").trim();
      if (!s || s === "-" || s.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(s)) return s;
      if (!s.startsWith("/")) s = "/" + s;
      return s;
    };
    const index = {};
    for (const service of Object.keys(sections || {})) {
      for (const s of (sections[service] || [])) {
        index["/" + service + "/" + s.slug + "/"] = { service, slug: s.slug };
      }
    }
    const matches = (item, type, filter) => {
      if (type && item && item.data && item.data.service_type !== type) return false;
      const secs = Array.isArray(item.sections) ? item.sections : [];
      if (secs.includes(filter)) return true;
      if (filter === "fixed-departures") return !!item.fixed_departure;
      if (filter === "best-sellers") return !!item.best_seller;
      if (filter === "k2-treks") return !!item.k2_trek;
      if (filter === "cultural-tours") return !!item.cultural_tour;
      if (filter === "8000m-peaks") return !!item.peak_8000m;
      return false;
    };
    const walk = (list) => (list || []).map((raw) => {
      const item = Object.assign({}, raw);
      item.url = norm(item.url);
      let children = walk(item.children);
      const sec = index[item.url];
      if (sec) {
        const journeys = (catalog || [])
          .filter((c) => matches(c, (sec.service === "special-interests" || sec.service === "holiday-types") ? "" : sec.service, sec.slug))
          .map((c) => ({ label: (c.data || {}).title, url: norm((c.data || {}).permalink) }))
          .filter((c) => c.label && c.url)
          .sort((a, b) => String(a.label).localeCompare(String(b.label)));
        if (journeys.length) {
          const merged = [{ label: "View all " + item.label, url: item.url }]
            .concat(children || [], journeys.slice(0, max));
          const seen = new Set();
          children = merged.filter((c) => {
            const key = norm(c.url);
            if (!c.label || !key || key === "-" || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }
      if (children && children.length) item.children = children;
      else delete item.children;
      return item;
    });
    return walk(items);
  });
  eleventyConfig.addFilter("withFaqBank", (faqs, bank, serviceType) => {
    // Trip ke apne sawalon ke baad aam sawalon ka bank. Jo sawal trip ne
    // khud likha ho, bank ka wahi sawal chhoR diya jata hai — trip ka
    // apna jawab hamesha bhaari rehta hai.
    const own = Array.isArray(faqs) ? faqs : [];
    if (!serviceType) return own;              // sirf journeys par
    const extra = Array.isArray(bank) ? bank : [];
    const key = (q) => String(q || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const seen = new Set(own.map((f) => key(f && f.question)));
    return own.concat(extra.filter((f) => f && f.question && !seen.has(key(f.question))));
  });
  // Bulandi: client sirf metre likhta hai, feet yahan bante hain. Europe
  // aur America ke trekkers feet mein sochte hain, aur unhein tarjuma khud
  // karne dena ek chhoti si rukawat hai jo muqabil chhoR dete hain.
  eleventyConfig.addFilter("altitudeBoth", (v) => {
    const s = String(v || "").trim();
    if (!s) return "";
    if (/ft|feet|'/i.test(s)) return s;              // pehle se feet mein hai
    // Ek se zyada adad ka matlab range hai ("4,200-4,600 m"). Us par ek hi
    // feet ka hindsa lagana ghalat tasveer deta, is liye chhoR dete hain.
    const nums = s.replace(/,/g, "").match(/\d{2,5}/g);
    if (!nums || nums.length !== 1) return s;
    const metres = Number(nums[0]);
    if (!metres || metres < 100 || metres > 9000) return s;
    const feet = Math.round((metres * 3.28084) / 10) * 10;
    return s + " / " + feet.toLocaleString("en-US") + " ft";
  });

  // Wahi adad Google ke liye — likhai nahi, sirf number.
  eleventyConfig.addFilter("altitudeMetres", (v) => {
    const nums = String(v || "").replace(/,/g, "").match(/\d{2,5}/g);
    if (!nums || nums.length !== 1) return null;    // range par koi ek adad nahi
    const metres = Number(nums[0]);
    return metres >= 100 && metres <= 9000 ? metres : null;
  });

  // "35.8825, 76.5133" -> alag alag. Ghalat likha ho to kuch nahi lautata,
  // taake safhe par toota hua naqsha ka link kabhi na aaye.
  const geoParts = (v) => {
    const m = String(v || "").match(/(-?\d{1,3}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (!m) return null;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
  };
  eleventyConfig.addFilter("geoLat", (v) => { const g = geoParts(v); return g ? g.lat : null; });
  eleventyConfig.addFilter("geoLon", (v) => { const g = geoParts(v); return g ? g.lon : null; });
  eleventyConfig.addFilter("relatedJourneys", (picked, catalog, selfUrl) => {
    // Client form mein sirf naam chunta hai. Link yahan catalogue se nikalta
    // hai, is liye naam badal jane par toota hua link nahi rehta — woh entry
    // khamoshi se ghaib ho jati hai.
    const want = Array.isArray(picked) ? picked : (picked ? [picked] : []);
    if (!want.length) return [];

    // Catalogue ke andar jahan bhi naam aur pata dono mile, woh trip hai.
    const JOURNEY_URL = /^\/(tours|trekking|expeditions|jeep-safaris|hunting-services|destinations|blog|vehicles)\/[^/]+\/?$/;
    const found = [];
    const walk = (node, depth) => {
      if (!node || depth > 5) return;
      if (Array.isArray(node)) { for (const n of node) walk(n, depth + 1); return; }
      if (typeof node !== "object") return;
      const t = node.title || node.label || node.name;
      const u = node.url || node.permalink || node.href || node.path;
      if (typeof t === "string" && typeof u === "string" && JOURNEY_URL.test(u)) {
        found.push({ ...node, title: t.trim(), url: u });
        return;
      }
      for (const v of Object.values(node)) walk(v, depth + 1);
    };
    walk(catalog, 0);

    const key = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    const byTitle = new Map();
    for (const it of found) {
      const t = key(it.title);
      if (t && !byTitle.has(t)) byTitle.set(t, it);
    }

    const out = [];
    const seen = new Set();
    for (const w of want) {
      const it = byTitle.get(key(w));
      if (!it) continue;
      if (selfUrl && it.url === selfUrl) continue;   // apne aap se link nahi
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      out.push(it);
    }
    return out;
  });
  eleventyConfig.addFilter("catalogFilter", (arr,type,filter,query="") => {
    const normalize=value=>String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
    const q=normalize(query), words=q.split(" ").filter(Boolean);
    const matchesFilter=item=>{ if(!filter)return true; const secs=Array.isArray(item.sections)?item.sections:[]; if(secs.includes(filter))return true; if(filter==="fixed-departures")return !!item.fixed_departure; if(filter==="best-sellers")return !!item.best_seller; if(filter==="k2-treks")return !!item.k2_trek; if(filter==="cultural-tours")return !!item.cultural_tour; if(filter==="8000m-peaks")return !!item.peak_8000m; return false; };
    const score=item=>{ if(!q)return 1; const hay=normalize([item.normalized_title,item.normalized_slug,item.normalized_tags,item.normalized_destination,item.normalized_summary].join(" ")); if(!words.every(word=>hay.includes(word)))return 0; let n=10; if(item.normalized_title===q)n+=1200; else if(item.normalized_title?.startsWith(q))n+=900; else if(item.normalized_title?.includes(q))n+=700; if(item.normalized_slug?.includes(q))n+=480; if(item.normalized_tags?.includes(q))n+=360; if(item.normalized_destination?.includes(q))n+=260; return n; };
    return (arr||[]).filter(item=>(!type||type==="all"||item.data?.service_type===type)&&matchesFilter(item)).map(item=>({item,score:score(item)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.item.data?.title||"").localeCompare(String(b.item.data?.title||""))).map(x=>x.item);
  });
  return {dir:{input:"src",includes:"_includes",data:"_data",output:"_site"},markdownTemplateEngine:"njk",htmlTemplateEngine:"njk"};
}
