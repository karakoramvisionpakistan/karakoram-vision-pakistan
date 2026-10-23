// GET /api/reviews -> the reviews the client has published in the dashboard (first name + country only).
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
});

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ reviews: [] });
  try {
    const result = await env.DB.prepare(
      "SELECT id, name, country, journey, travel_date, rating, review, created_at FROM reviews WHERE status = 'published' ORDER BY COALESCE(decided_at, created_at) DESC, id DESC LIMIT 60"
    ).all();
    const reviews = (result.results || []).map((r) => ({
      id: r.id,
      first_name: String(r.name || '').trim().split(/\s+/)[0] || 'Guest',
      country: r.country || '',
      journey: r.journey || '',
      travel_date: r.travel_date || '',
      rating: r.rating || 5,
      review: r.review,
    }));
    return json({ reviews });
  } catch (error) {
    console.error('reviews: could not read database:', error && error.message);
    return json({ reviews: [] });
  }
}
