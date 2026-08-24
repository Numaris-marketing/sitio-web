import https from "https";
import { getZohoToken } from "./_zoho-token.js";

function zohoGet(token, path) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: "www.zohoapis.com", path, method: "GET",
        headers: { Authorization: `Bearer ${token}` } },
      (res) => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); } });
      }
    );
    req.on("error", e => resolve({ error: e.message }));
    req.end();
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  const token = await getZohoToken();
  const deals = await zohoGet(token, "/crm/v2/Deals?per_page=3&fields=Deal_Name,Stage,Owner");
  const accounts = await zohoGet(token, "/crm/v2/Accounts?per_page=3&fields=Account_Name,Owner");
  res.status(200).json({ token: token.slice(0, 20) + "...", deals, accounts });
}
