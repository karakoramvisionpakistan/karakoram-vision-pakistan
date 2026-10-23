// Minimal SMTP client for Cloudflare Workers / Pages Functions.
// Supports implicit TLS (port 465) and AUTH PLAIN, which is what cPanel/GoDaddy mail uses.
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (str) => {
  let bin = '';
  for (const b of enc.encode(str)) bin += String.fromCharCode(b);
  return btoa(bin);
};
const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim();
const addrOf = (a) => {
  const m = String(a).match(/<([^<>\s]+)>/);
  return (m ? m[1] : String(a)).trim();
};
const validAddr = (a) => /^[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+$/.test(a);

// RFC 2047 encoding for non-ASCII header text (e.g. subjects with accents)
const encodeHeader = (text) => {
  const t = oneLine(text);
  if (/^[\x20-\x7e]*$/.test(t)) return t;
  const words = [];
  let chunk = '';
  for (const ch of t) {
    if (enc.encode(chunk + ch).length > 42) { words.push(chunk); chunk = ''; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${b64(w)}?=`).join('\r\n ');
};

const withTimeout = (promise, ms, what) => {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`SMTP timeout while ${what}`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export async function sendMail({
  connect, host, port = 465, secure = true, user, pass,
  from, fromName = '', to, replyTo = '', subject, text,
  heloName = 'website.local', timeoutMs = 15000,
}) {
  const fromAddr = addrOf(from);
  const recipients = (Array.isArray(to) ? to : String(to).split(/[,;]/)).map((s) => addrOf(s)).filter(Boolean);
  if (!validAddr(fromAddr)) throw new Error('Invalid sender address');
  if (!recipients.length || !recipients.every(validAddr)) throw new Error('Invalid recipient address');
  const reply = replyTo && validAddr(addrOf(replyTo)) ? addrOf(replyTo) : '';

  const socket = connect({ hostname: host, port: Number(port) }, { secureTransport: secure ? 'on' : 'off', allowHalfOpen: false });
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  let buf = '';

  const readLine = async () => {
    for (;;) {
      const i = buf.indexOf('\n');
      if (i >= 0) { const line = buf.slice(0, i).replace(/\r$/, ''); buf = buf.slice(i + 1); return line; }
      const { value, done } = await withTimeout(reader.read(), timeoutMs, 'reading from server');
      if (done) throw new Error('SMTP connection closed unexpectedly');
      buf += dec.decode(value, { stream: true });
    }
  };
  const readReply = async () => {
    const lines = [];
    for (;;) {
      const line = await readLine();
      lines.push(line);
      if (!/^\d{3}-/.test(line)) break;
    }
    return { code: parseInt(lines[lines.length - 1].slice(0, 3), 10), text: lines.join(' | ') };
  };
  const send = (line) => withTimeout(writer.write(enc.encode(line + '\r\n')), timeoutMs, 'writing to server');
  const command = async (line, okCodes, label) => {
    await send(line);
    const r = await readReply();
    if (!okCodes.includes(r.code)) throw new Error(`SMTP ${r.code} at ${label || line.split(' ')[0]}: ${r.text}`);
    return r;
  };

  try {
    const hello = await readReply();
    if (hello.code !== 220) throw new Error(`SMTP ${hello.code} at greeting: ${hello.text}`);
    await command(`EHLO ${heloName}`, [250], 'EHLO');
    await command(`AUTH PLAIN ${b64(`\0${user}\0${pass}`)}`, [235], 'AUTH');
    await command(`MAIL FROM:<${fromAddr}>`, [250], 'MAIL FROM');
    for (const r of recipients) await command(`RCPT TO:<${r}>`, [250, 251], 'RCPT TO');
    await command('DATA', [354], 'DATA');

    const safeName = oneLine(fromName).replace(/["\\<>]/g, '');
    const fromHeader = safeName ? `${encodeHeader(safeName)} <${fromAddr}>` : fromAddr;
    const domain = fromAddr.split('@')[1];
    const body = (b64(String(text).replace(/\r?\n/g, '\r\n')).match(/.{1,76}/g) || []).join('\r\n');
    const headers = [
      `From: ${fromHeader}`,
      `To: ${recipients.join(', ')}`,
      ...(reply ? [`Reply-To: ${reply}`] : []),
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
      `Message-ID: <${crypto.randomUUID()}@${domain}>`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
    ];
    await send(`${headers.join('\r\n')}\r\n\r\n${body}\r\n.`);
    const done = await readReply();
    if (done.code !== 250) throw new Error(`SMTP ${done.code} after message: ${done.text}`);
    try { await send('QUIT'); } catch { /* ignore */ }
    return { ok: true };
  } finally {
    try { writer.releaseLock(); reader.releaseLock(); } catch { /* ignore */ }
    try { await socket.close(); } catch { /* ignore */ }
  }
}
