// A fingerprint of the built stylesheet, used in its address.
//
// The address used to end in a hand-written ?v=11.15.0 which nobody
// remembered to change, so every cache in the chain - the service worker, the
// browser, Cloudflare - went on serving yesterday's stylesheet.
//
// Now the number comes from the file's own contents. Same file, same address,
// cached hard and fast. One character different and it is a new address that
// nothing has ever seen, so the new one is fetched at once.
//
// build:css runs before eleventy, so the file is already there when this runs.
import fs from "node:fs";
import crypto from "node:crypto";

export default function () {
  try {
    const css = fs.readFileSync("src/assets/css/site.css");
    return crypto.createHash("sha1").update(css).digest("hex").slice(0, 10);
  } catch {
    // No stylesheet yet (a bare checkout, say). A changing value is safer
    // here than a fixed one - worst case something is fetched twice.
    return String(Date.now());
  }
}
