export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  const config = {
    projectId: process.env.MANUS_PROJECT_ID || "",
    oauthPortalUrl: process.env.MANUS_OAUTH_PORTAL_URL || "",
    apiUrl: process.env.MANUS_API_URL || "",
    apiBrowserKey: process.env.MANUS_API_BROWSER_KEY || ""
  };
  res.status(200).send(`window.__MANUS_CONFIG__=${JSON.stringify(config)};`);
}
