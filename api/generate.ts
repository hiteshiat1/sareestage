import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED = new Set([
  "https://sareestage-v2-887514490287.us-west1.run.app", // your React app origin
  "http://localhost:3000",
  "http://localhost:5173",
]);

function setCors(res: VercelResponse, origin?: string | null, withCreds = false) {
  if (origin && ALLOWED.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    if (withCreds) res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers["origin"] as string) || null;
  setCors(res, origin);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const backend = process.env.BACKEND_URL; // e.g. https://<your-node-backend-host>
  if (!backend) {
    return res.status(500).json({ error: "BACKEND_URL not set" });
  }

  try {
    const r = await fetch(`${backend}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    setCors(res, origin);
    return res.send(text);
  } catch (e: any) {
    setCors(res, origin);
    return res.status(502).json({ error: String(e?.message || e) });
  }
}
