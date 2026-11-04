import test from "node:test";
import assert from "node:assert/strict";
import { publicIPv4, websiteURL } from "../server/website-metadata.mjs";
test("website previews accept HTTPS public hosts and reject local or credentialed URLs", () => {
  for (const url of [
    "http://example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://10.0.0.1",
    "https://[::1]",
    "https://user:password@example.com",
    "https://example.com:5006",
    "file:///etc/passwd",
  ])
    assert.throws(() => websiteURL(url));
  assert.equal(
    websiteURL("https://example.com/path?q=1#part").href,
    "https://example.com/path?q=1#part",
  );
  for (const address of [
    "0.0.0.0",
    "10.1.2.3",
    "127.0.0.1",
    "169.254.169.254",
    "172.31.1.2",
    "192.168.1.1",
    "100.64.1.1",
    "224.1.1.1",
    "198.18.0.1",
  ])
    assert.equal(publicIPv4(address), false, address);
  assert.equal(publicIPv4("1.1.1.1"), true);
});
