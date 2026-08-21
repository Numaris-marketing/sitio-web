// Returns a valid Zoho OAuth token. Called by the frontend first so the
// other three lambdas receive the token and never need to call OAuth directly.
import { getZohoToken } from "./_zoho-token.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  try {
    const token = await getZohoToken();
    res.status(200).json({ token });
  } catch (err) {
    console.error("zoho-token:", err.message);
    res.status(500).json({ error: err.message });
  }
}
