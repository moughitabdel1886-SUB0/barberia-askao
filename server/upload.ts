import type { Express, Request, Response } from "express";
import multer from "multer";
import { CSRF_HEADER, getRequestAdmin } from "./auth";
import { clientIp, rateLimit } from "./rateLimit";
import { storagePut } from "./storage";

const MIME_MAP: Record<string, { ext: string; type: "image" | "video" }> = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/avif": { ext: "avif", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "video/mp4": { ext: "mp4", type: "video" },
  "video/webm": { ext: "webm", type: "video" },
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 48 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!MIME_MAP[file.mimetype]) {
      callback(new Error("Formato no permitido. Usa JPG, PNG, WebP, AVIF, GIF, MP4 o WebM."));
      return;
    }
    callback(null, true);
  },
});

function safeBaseName(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "archivo"
  );
}

export function registerUploadRoute(app: Express) {
  const requireUploadAccess = (req: Request, res: Response, next: () => void) => {
    void (async () => {
      try {
        const admin = await getRequestAdmin(req);
        if (!admin) {
          res.status(401).json({ error: "Sesión caducada. Vuelve a entrar." });
          return;
        }
        if (req.headers[CSRF_HEADER] !== "1") {
          res.status(403).json({ error: "Petición no válida." });
          return;
        }
        const limit = rateLimit(`upload:${clientIp(req)}`, 30, 60 * 60 * 1000);
        if (!limit.allowed) {
          res.status(429).json({ error: "Demasiadas subidas. Espera un poco." });
          return;
        }
        next();
      } catch (error) {
        console.error("[upload] access check failed:", error);
        res.status(500).json({ error: "No se pudo comprobar la sesión." });
      }
    })();
  };

  app.post("/api/admin/upload", requireUploadAccess, (req, res, next) => {
    upload.single("file")(req, res, error => {
      if (error) {
        const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el máximo de 48 MB. Comprime el vídeo antes de subirlo."
          : error instanceof Error
            ? error.message
            : "No se pudo leer el archivo.";
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No has seleccionado ningún archivo." });
        return;
      }

      const mime = MIME_MAP[file.mimetype];
      if (!mime) {
        res.status(400).json({ error: "Formato no permitido." });
        return;
      }
      if (mime.type === "image" && file.size > MAX_IMAGE_BYTES) {
        res.status(400).json({ error: "La imagen supera los 10 MB. Redúcela antes de subirla." });
        return;
      }

      const key = `media/${Date.now()}-${safeBaseName(file.originalname)}.${mime.ext}`;
      const stored = await storagePut(key, file.buffer, file.mimetype);

      res.json({
        url: stored.url,
        key: stored.key,
        type: mime.type,
        mime: file.mimetype,
        size: file.size,
      });
    } catch (error) {
      console.error("[upload] failed:", error);
      res.status(500).json({ error: "No se pudo subir el archivo. Inténtalo de nuevo." });
    }
  });
}
