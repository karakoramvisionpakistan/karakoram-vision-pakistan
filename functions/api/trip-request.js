// POST /api/trip-request  -> emails website forms (trip requests, guest reviews) to the client through the hosting mail server,
// and keeps a copy in a Google Sheet. A hidden field _type=review marks a guest review.
// Required environment variables (Pages project > Settings > Variables and secrets):
//   SMTP_HOST   e.g. p3plzcpnl507872.prod.phx3.secureserver.net
//   SMTP_PORT   465
//   SMTP_USER   e.g. alerts@karakoramvision.com
//   SMTP_PASS   mailbox password   (secret)
//   TRIP_MAIL_TO  where requests go, comma separated
// Optional: TRIP_MAIL_FROM (defaults to SMTP_USER), TRIP_MAIL_FROM_NAME
// Optional Google Sheet copy of every inquiry: SHEET_WEBHOOK_URL, SHEET_TOKEN
// Guest reviews are also saved as 'pending' in the D1 database bound as DB (the CMS dashboard moderates them).
// Optional: DASHBOARD_URL (link added to the review email)
import { connect } from 'cloudflare:sockets';
import { sendMail } from '../_lib/smtp.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const wantsJson = (request) => (request.headers.get('Accept') || '').includes('application/json');
const humanize = (key) => key.replace(/[_\-\[\]]+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const asJson = wantsJson(request);
  let nextPath = '/plan-a-trip/';
  const succeed = () => (asJson ? json({ ok: true }) : Response.redirect(`${url.origin}${nextPath}?sent=1`, 303));
  const fail = (status, error) => (asJson ? json({ ok: false, error }, status) : Response.redirect(`${url.origin}${nextPath}?error=1`, 303));

  const origin = request.headers.get('Origin');
  if (origin) {
    try { if (new URL(origin).host !== url.host) return json({ ok: false, error: 'forbidden' }, 403); }
    catch { return json({ ok: false, error: 'forbidden' }, 403); }
  }

  let form;
  try { form = await request.formData(); } catch { return fail(400, 'bad_request'); }

  const isReview = String(form.get('_type') || '') === 'review';
  const next = String(form.get('_next') || '');
  if (/^\/[A-Za-z0-9\-_\/]*$/.test(next) && !next.startsWith('//')) nextPath = next;
  else if (isReview) nextPath = '/guest-reviews/';

  // Honeypot: real visitors never fill this hidden field. Pretend success so bots move on.
  if (String(form.get('_hp') || '').trim()) return succeed();

  const rows = [];
  let email = '';
  let name = '';
  for (const [key, value] of form.entries()) {
    if (key.startsWith('_') || typeof value !== 'string') continue;
    const v = value.trim().slice(0, 4000);
    if (!v) continue;
    rows.push([humanize(key), v]);
    if (!email && /e-?mail/i.test(key) && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)) email = v;
    if (!name && /name/i.test(key)) name = v;
  }
  if (!rows.length || rows.length > 60) return fail(400, 'empty_form');

  const clip = (value, max) => String(value || '').trim().slice(0, max);
  const review = isReview ? {
    name: clip(form.get('full_name'), 100),
    email,
    country: clip(form.get('country'), 80),
    journey: clip(form.get('journey'), 150),
    travelDate: clip(form.get('travel_date'), 60),
    rating: Math.min(5, Math.max(1, parseInt(String(form.get('rating') || '5'), 10) || 5)),
    text: clip(form.get('review'), 3000),
  } : null;
  if (isReview && (!review.name || !review.text || !String(form.get('consent') || '').trim())) return fail(400, 'missing_fields');

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TRIP_MAIL_TO } = env;
  const emailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && TRIP_MAIL_TO);
  const sheetConfigured = Boolean(env.SHEET_WEBHOOK_URL && env.SHEET_TOKEN);
  const dbConfigured = Boolean(isReview && env.DB);
  const inquiryDbConfigured = Boolean(!isReview && env.DB);
  if (!emailConfigured && !sheetConfigured && !dbConfigured && !inquiryDbConfigured) {
    console.error('trip-request: neither mail, sheet nor database settings are configured');
    return fail(500, 'not_configured');
  }

  const meta = {
    Page: request.headers.get('Referer') || url.origin,
    Received: new Date().toISOString(),
    IP: request.headers.get('CF-Connecting-IP') || 'unknown',
  };

  const text = [
    isReview ? 'New guest review from the website' : 'New trip request from the website',
    '',
    ...rows.map(([label, value]) => (value.includes('\n') ? `${label}:\n${value}` : `${label}: ${value}`)),
    '',
    '---',
    `Page: ${meta.Page}`,
    `Received: ${meta.Received}`,
    `IP: ${meta.IP}`,
    ...(isReview && env.DASHBOARD_URL ? ['', `To publish or reject this review, open the dashboard: ${env.DASHBOARD_URL}`] : []),
  ].join('\n');

  const sendEmail = async () => {
    if (!emailConfigured) throw new Error('email not configured');
    await sendMail({
      connect,
      host: SMTP_HOST,
      port: SMTP_PORT || 465,
      secure: true,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: env.TRIP_MAIL_FROM || SMTP_USER,
      fromName: env.TRIP_MAIL_FROM_NAME || 'Karakoram Website',
      to: TRIP_MAIL_TO,
      replyTo: email,
      subject: `${isReview ? 'New guest review' : 'New trip request'}${name ? `: ${name}` : ''}`,
      text,
    });
  };

  // Copy of the inquiry in a Google Sheet (a Google Apps Script web app receives it).
  const saveToSheet = async () => {
    if (!sheetConfigured) throw new Error('sheet not configured');
    const body = new URLSearchParams({ token: env.SHEET_TOKEN, tab: isReview ? 'Reviews' : 'Inquiries' });
    for (const [label, value] of [...rows, ...Object.entries(meta)]) body.set(label, value);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(env.SHEET_WEBHOOK_URL, { method: 'POST', body, redirect: 'follow', signal: controller.signal });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(`sheet responded ${response.status} ${result.error || ''}`.trim());
    } finally { clearTimeout(timer); }
  };

  // Guest reviews wait as 'pending' in the database until the client publishes them in the dashboard.
  const saveReview = async () => {
    if (!dbConfigured) throw new Error('database not used');
    await env.DB.prepare(
      'INSERT INTO reviews (name, email, country, journey, travel_date, rating, review) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(review.name, review.email || null, review.country || null, review.journey || null, review.travelDate || null, review.rating, review.text).run();
  };

  // All of them run at the same time. The visitor sees success if at least one of them worked,
  // so an inquiry is never lost because one of the two had a problem.
  // Darkhwast dashboard ke inbox mein mehfooz hoti hai. Email aur Sheet
  // pehle ki tarah chalte rahenge — yeh un ke alawa hai, un ki jagah nahi.
  const saveInquiry = async () => {
    if (!inquiryDbConfigured) throw new Error('inquiry database not used');
    const pick = (...keys) => {
      for (const key of keys) {
        const value = form.get(key);
        if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 400);
      }
      return null;
    };
    await env.DB.prepare(
      'INSERT INTO inquiries (name, email, phone, journey, service, travel_date, group_size, message, payload, page, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      name || pick('full_name', 'name'),
      email || pick('email'),
      pick('phone', 'whatsapp', 'contact_number', 'mobile'),
      pick('journey', 'trip', 'package', 'tour'),
      pick('service', 'service_type'),
      pick('travel_date', 'start_date', 'start', 'dates', 'travel_dates'),
      pick('group_size', 'travellers', 'travelers', 'people', 'adults'),
      pick('message', 'notes', 'details', 'comments', 'requirements'),
      JSON.stringify(Object.fromEntries(rows)),
      meta.Page,
      meta.IP
    ).run();
  };

  const [mailResult, sheetResult, dbResult, inquiryResult] = await Promise.allSettled([sendEmail(), saveToSheet(), saveReview(), saveInquiry()]);
  if (mailResult.status === 'rejected' && emailConfigured) console.error('trip-request: email failed:', mailResult.reason && mailResult.reason.message);
  if (sheetResult.status === 'rejected' && sheetConfigured) console.error('trip-request: sheet failed:', sheetResult.reason && sheetResult.reason.message);
  if (dbResult.status === 'rejected' && dbConfigured) console.error('trip-request: database failed:', dbResult.reason && dbResult.reason.message);
  if (inquiryResult.status === 'rejected' && inquiryDbConfigured) console.error('trip-request: inquiry save failed:', inquiryResult.reason && inquiryResult.reason.message);
  if (mailResult.status === 'fulfilled' || sheetResult.status === 'fulfilled' || dbResult.status === 'fulfilled' || inquiryResult.status === 'fulfilled') return succeed();
  if (env.TRIP_DEBUG && asJson) {
    const why = (x) => (x.status === 'rejected' ? String((x.reason && x.reason.message) || x.reason) : 'ok');
    return json({ ok: false, error: 'send_failed', detail: { email: why(mailResult), sheet: why(sheetResult), db: why(dbResult), inquiry: why(inquiryResult) } }, 502);
  }
  return fail(502, 'send_failed');
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
