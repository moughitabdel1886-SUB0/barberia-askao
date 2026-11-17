export default function handler(req, res) {
  const apiUrl = process.env.VITE_API_URL || process.env.MANUS_API_URL || "https://barberia-askao-production.up.railway.app";
  const config = {
    projectId: process.env.MANUS_PROJECT_ID || "barberia-askao",
    oauthPortalUrl: process.env.MANUS_OAUTH_PORTAL_URL || apiUrl,
    apiUrl: apiUrl,
    apiBrowserKey: process.env.MANUS_API_BROWSER_KEY || process.env.VITE_API_BROWSER_KEY || ""
  };
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(`window.__MANUS_CONFIG__ = ${JSON.stringify(config)};`);
}
