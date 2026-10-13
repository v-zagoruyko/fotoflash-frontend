// Drives a real headless Chrome through the DevTools protocol (no dependencies, Node 22+).
// Usage: node scripts/cdp-run.mjs <url> <screenshot-prefix> <step>...
//   steps: "eval:<js>" (prints the result), "sleep:<ms>", "shot:<name>" (<prefix>-<name>.png),
//          "code:<email>" (waits for the sign-in code in mailpit, then "__CODE__" is replaced in eval steps)
// Chrome path is the macOS default; adjust for other systems.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const [url, outPrefix, ...steps] = process.argv.slice(2);
let lastCode = "";
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=9333",
  "--window-size=900,900", "--user-data-dir=/tmp/cdp-profile-" + Date.now(), "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list;
for (let i = 0; i < 50; i++) {
  try { list = await (await fetch("http://127.0.0.1:9333/json")).json(); if (list.length) break; } catch {}
  await sleep(200);
}
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${outPrefix}-${name}.png`, Buffer.from(r.result.data, "base64")); };

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 900, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });
await sleep(4000);
for (const step of steps) {
  const [kind, arg] = [step.slice(0, step.indexOf(":")), step.slice(step.indexOf(":") + 1)];
  if (kind === "eval") console.log("eval:", JSON.stringify(await evaluate(arg.replaceAll("__CODE__", lastCode))));
  if (kind === "code") {
    for (let i = 0; i < 20 && !lastCode; i++) {
      const list = await (await fetch("http://localhost:8025/api/v1/messages")).json();
      const msg = list.messages.find((m) => m.To.some((t) => t.Address === arg));
      if (msg) {
        const full = await (await fetch("http://localhost:8025/api/v1/message/" + msg.ID)).json();
        lastCode = full.Text.match(/\b(\d{6})\b/)?.[1] ?? "";
      }
      if (!lastCode) await sleep(500);
    }
    console.log("code:", lastCode);
  }
  if (kind === "sleep") await sleep(Number(arg));
  if (kind === "shot") await shot(arg);
}
ws.close(); chrome.kill();
