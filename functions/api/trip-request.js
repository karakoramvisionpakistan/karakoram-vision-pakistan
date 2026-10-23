// POST /api/trip-request  -> emails the trip request form to the client through the hosting mail server.
// Required environment variables (Pages project > Settings > Variables and secrets):
//   SMTP_HOST   e.g. p3plzcpnl507872.prod.phx3.secureserver.net
//   SMTP_PORT   465
//   SMTP_USER   e.g. alerts@karakoramvision.com
//   SMTP_PASS   mailbox password   (secret)
//   TRIP_MAIL_TO  where requests go, comma separated
// Optional: TRIP_MAIL_FROM (defaults to SMTP_USER), TRIP_MAIL_FROM_NAME
// Optional Google Sheet copy of every inquiry: SHEET_WEBHOOK_URL, SHEET_TOKEN
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
  const succeed = () => (asJson ? json({ ok: true }) : Response.redirect(`${url.origin}/plan-a-trip/?sent=1#trip-request-form`, 303));
  const fail = (status, error) => (asJson ? json({ ok: false, error }, status) : Response.redirect(`${url.origin}/plan-a-trip/?error=1#trip-request-form`, 303));

  const origin = request.headers.get('Origin');
  if (origin) {
    try { if (new URL(origin).host !== url.host) return json({ ok: false, error: 'forbidden' }, 403); }
    catch { return json({ ok: false, error: 'forbidden' }, 403); }
  }

  let form;
  try { form = await request.formData(); } catch { return fail(400, 'bad_request'); }

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

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TRIP_MAIL_TO } = env;
  const emailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && TRIP_MAIL_TO);
  const sheetConfigured = Boolean(env.SHEET_WEBHOOK_URL && env.SHEET_TOKEN);
  if (!emailConfigured && !sheetConfigured) {
    console.error('trip-request: neither mail nor sheet settings are configured');
    return fail(500, 'not_configured');
  }

  const meta = {
    Page: request.headers.get('Referer') || url.origin,
    Received: new Date().toISOString(),
    IP: request.headers.get('CF-Connecting-IP') || 'unknown',
  };

  const text = [
    'New trip request from the website',
    '',
    ...rows.map(([label, value]) => (value.includes('\n') ? `${label}:\n${value}` : `${label}: ${value}`)),
    '',
    '---',
    `Page: ${meta.Page}`,
    `Received: ${meta.Received}`,
    `IP: ${meta.IP}`,
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
      subject: name ? `New trip request: ${name}` : 'New trip request',
      text,
    });
  };

  // Copy of the inquiry in a Google Sheet (a Google Apps Script web app receives it).
  const saveToSheet = async () => {
    if (!sheetConfigured) throw new Error('sheet not configured');
    const body = new URLSearchParams({ token: env.SHEET_TOKEN });
    for (const [label, value] of [...rows, ...Object.entries(meta)]) body.set(label, value);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(env.SHEET_WEBHOOK_URL, { method: 'POST', body, redirect: 'follow', signal: controller.signal });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(`sheet responded ${response.status} ${result.error || ''}`.trim());
    } finally { clearTimeout(timer); }
  };

  // Both run at the same time. The visitor sees success if at least one of them worked,
  // so an inquiry is never lost because one of the two had a problem.
  const [mailResult, sheetResult] = await Promise.allSettled([sendEmail(), saveToSheet()]);
  if (mailResult.status === 'rejected' && emailConfigured) console.error('trip-request: email failed:', mailResult.reason && mailResult.reason.message);
  if (sheetResult.status === 'rejected' && sheetConfigured) console.error('trip-request: sheet failed:', sheetResult.reason && sheetResult.reason.message);
  if (mailResult.status === 'fulfilled' || sheetResult.status === 'fulfilled') return succeed();
  return fail(502, 'send_failed');
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
