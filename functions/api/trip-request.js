// POST /api/trip-request  -> emails the trip request form to the client through the hosting mail server.
// Required environment variables (Pages project > Settings > Variables and secrets):
//   SMTP_HOST   e.g. p3plzcpnl507872.prod.phx3.secureserver.net
//   SMTP_PORT   465
//   SMTP_USER   e.g. alerts@karakoramvision.com
//   SMTP_PASS   mailbox password   (secret)
//   TRIP_MAIL_TO  where requests go, comma separated
// Optional: TRIP_MAIL_FROM (defaults to SMTP_USER), TRIP_MAIL_FROM_NAME
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
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !TRIP_MAIL_TO) {
    console.error('trip-request: mail settings are missing in the Pages project');
    return fail(500, 'not_configured');
  }

  const text = [
    'New trip request from the website',
    '',
    ...rows.map(([label, value]) => (value.includes('\n') ? `${label}:\n${value}` : `${label}: ${value}`)),
    '',
    '---',
    `Page: ${request.headers.get('Referer') || url.origin}`,
    `Received: ${new Date().toISOString()}`,
    `IP: ${request.headers.get('CF-Connecting-IP') || 'unknown'}`,
  ].join('\n');

  try {
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
  } catch (error) {
    console.error('trip-request: sending failed:', error && error.message);
    return fail(502, 'send_failed');
  }
  return succeed();
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
