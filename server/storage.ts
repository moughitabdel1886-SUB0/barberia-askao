// Storage via Cloudinary - tswira kat-b9a dima
function getCloudinaryConfig() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) throw new Error("CLOUDINARY_URL manquante");

  const m = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (!m) throw new Error("CLOUDINARY_URL invalide");
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { apiKey, apiSecret, cloudName } = getCloudinaryConfig();

  const buffer = typeof data === "string"
    ? Buffer.from(data)
    : Buffer.from(data as Uint8Array);

  const base64 = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;

  const form = new FormData();
  form.append("file", dataUri);
  form.append("public_id", relKey.replace(/\.[^.]+$/, ""));
  form.append("folder", "barber-shop");
  form.append("resource_type", "auto");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form as any,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Cloudinary upload failed: ${txt}`);
  }

  const json: any = await resp.json();
  return { key: json.public_id, url: json.secure_url };
}

export async function storageGet(relKey: string) {
  return { key: relKey, url: relKey };
}

export async function storageGetSignedUrl(relKey: string) {
  return relKey;
}