import {
  AdminCard,
  AdminSectionHeader,
  EmptyState,
  Field,
  IconButton,
  Spinner,
  btnAccent,
  btnSecondary,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import { uploadMediaFile } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import type { PublicMedia } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Check, ImagePlus, Images, Play, Trash2, UploadCloud, Video } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "fade", label: "Degradado" },
  { id: "classic", label: "Clásico" },
  { id: "modern", label: "Moderno" },
  { id: "beard", label: "Barba" },
  { id: "lines", label: "Líneas" },
  { id: "eyebrows", label: "Cejas" },
  { id: "kids", label: "Niños" },
] as const;

type UploadProgress = { name: string; status: "uploading" | "done" | "error"; message?: string };

function MediaCard({
  item,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
  busy,
}: {
  item: PublicMedia;
  index: number;
  total: number;
  onUpdate: (patch: { title?: string | null; alt?: string | null; category?: string }) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  busy: boolean;
}) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const dirty = alt.trim() !== (item.alt ?? "").trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper-soft shadow-soft">
      <div className="relative aspect-square bg-paper-deep">
        {item.type === "video" ? (
          <>
            <video src={item.url} className="h-full w-full object-cover" muted loop playsInline preload="metadata" controls />
            <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.1em] text-paper-soft">
              <Video className="h-3 w-3" aria-hidden="true" />
              Vídeo
            </span>
          </>
        ) : (
          <>
            <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
            <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-paper-soft/90 px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.1em] text-ink backdrop-blur">
              <ImagePlus className="h-3 w-3" aria-hidden="true" />
              Imagen
            </span>
          </>
        )}
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          <IconButton label="Subir" onClick={() => onMove(-1)} disabled={index === 0 || busy} className="h-8 w-8 bg-paper-soft/90">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
          <IconButton label="Bajar" onClick={() => onMove(1)} disabled={index === total - 1 || busy} className="h-8 w-8 bg-paper-soft/90">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="space-y-2 p-2.5">
        <select
          aria-label="Categoría"
          value={item.category}
          onChange={event => onUpdate({ category: event.target.value })}
          className={`${selectClass} min-h-9 text-xs`}
        >
          {CATEGORIES.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5">
          <input
            aria-label="Texto alternativo"
            value={alt}
            onChange={event => setAlt(event.target.value)}
            placeholder="Texto alternativo"
            className={`${inputClass} min-h-9 flex-1 text-xs`}
          />
          {dirty ? (
            <IconButton label="Guardar texto alternativo" onClick={() => onUpdate({ alt: alt.trim() || null })} disabled={busy} className="h-9 w-9">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[0.65rem] font-extrabold text-vermilion transition hover:bg-vermilion/8 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Eliminar de la galería
        </button>
      </div>
    </div>
  );
}

export function MediaAdmin() {
  const utils = trpc.useUtils();
  const mediaQuery = trpc.admin.media.list.useQuery();
  const fileInput = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>("general");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [dragging, setDragging] = useState(false);

  const invalidate = () => {
    utils.admin.media.list.invalidate();
    utils.site.bootstrap.invalidate();
  };

  const create = trpc.admin.media.create.useMutation();
  const update = trpc.admin.media.update.useMutation({
    onSuccess: invalidate,
    onError: error => toast.error(error.message),
  });
  const remove = trpc.admin.media.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Archivo eliminado de la galería.");
    },
    onError: error => toast.error(error.message),
  });
  const reorder = trpc.admin.media.reorder.useMutation({
    onSuccess: invalidate,
    onError: error => toast.error(error.message),
  });

  const media = mediaQuery.data ?? [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploading(true);
    setProgress(list.map(file => ({ name: file.name, status: "uploading" })));

    let uploadedCount = 0;
    for (let index = 0; index < list.length; index += 1) {
      const file = list[index];
      try {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) throw new Error("Formato no permitido.");
        if (isImage && file.size > 10 * 1024 * 1024) throw new Error("La imagen supera los 10 MB.");
        if (isVideo && file.size > 48 * 1024 * 1024) throw new Error("El vídeo supera los 48 MB.");

        const uploaded = await uploadMediaFile(file);
        await create.mutateAsync({
          url: uploaded.url,
          storageKey: uploaded.key,
          type: uploaded.type,
          category,
          title: null,
          alt: null,
        });
        uploadedCount += 1;
        setProgress(current =>
          current.map((entry, entryIndex) =>
            entryIndex === index ? { ...entry, status: "done" as const } : entry,
          ),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo subir.";
        setProgress(current =>
          current.map((entry, entryIndex) =>
            entryIndex === index ? { ...entry, status: "error" as const, message } : entry,
          ),
        );
      }
    }

    invalidate();
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (uploadedCount > 0) toast.success(`${uploadedCount} archivo${uploadedCount === 1 ? "" : "s"} añadido${uploadedCount === 1 ? "" : "s"} a la galería.`);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const ids = media.map(item => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate({ ids });
  };

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Galería"
        description="Sube fotos y vídeos del taller. Se muestran en la web en este orden; puedes cambiar categoría y texto alternativo."
      />

      <AdminCard>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink">Añadir piezas</p>
            <p className="mt-1 text-sm text-ink-soft">JPG, PNG, WebP, AVIF, GIF, MP4 o WebM.</p>
          </div>
          <Field label="Categoría de las nuevas piezas" htmlFor="upload-category" className="sm:w-52">
            <select id="upload-category" value={category} onChange={event => setCategory(event.target.value)} className={selectClass}>
              {CATEGORIES.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div
          className={cn(
            "mt-4 rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8",
            dragging ? "border-cobalt bg-sky-soft" : "border-line bg-paper",
          )}
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-paper-soft text-cobalt shadow-soft">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-display text-xl font-semibold text-ink">Arrastra aquí o elige archivos</p>
          <p className="mt-1 text-xs text-ink-faint">Máximo 10 MB por imagen y 48 MB por vídeo. Los vídeos se sirven tal cual; comprime antes si son muy pesados.</p>
          <input
            ref={fileInput}
            id="media-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm"
            multiple
            className="sr-only"
            onChange={event => void handleFiles(event.target.files)}
            disabled={uploading}
          />
          <label htmlFor="media-upload" className={`${btnAccent} mt-4 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
            {uploading ? <Spinner /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
            {uploading ? "Subiendo…" : "Elegir archivos"}
          </label>
        </div>

        {progress.length > 0 ? (
          <ul className="mt-3 space-y-1.5" aria-live="polite">
            {progress.map((entry, index) => (
              <li key={`${entry.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-xs">
                {entry.status === "uploading" ? (
                  <Spinner className="h-3.5 w-3.5 text-cobalt" />
                ) : entry.status === "done" ? (
                  <Check className="h-3.5 w-3.5 text-[#2f7d4e]" aria-hidden="true" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full bg-vermilion/20" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{entry.name}</span>
                <span className={cn("shrink-0 text-[0.62rem] font-bold", entry.status === "error" ? "text-vermilion" : "text-ink-faint")}>
                  {entry.status === "uploading" ? "Subiendo" : entry.status === "done" ? "Listo" : entry.message}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminCard>

      {mediaQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-2xl bg-paper-soft" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={<Images className="h-5 w-5" />}
          title="La galería está vacía"
          description="Sube la primera foto o vídeo para que aparezca en la web."
          action={
            <label htmlFor="media-upload" className={btnSecondary}>
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Elegir archivos
            </label>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {media.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              total={media.length}
              busy={update.isPending || remove.isPending || reorder.isPending}
              onUpdate={patch => update.mutate({ id: item.id, ...patch })}
              onMove={direction => move(index, direction)}
              onDelete={() => {
                if (window.confirm("¿Eliminar esta pieza de la galería? El archivo original seguirá guardado en el almacenamiento.")) {
                  remove.mutate({ id: item.id });
                }
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-dashed border-line bg-paper-soft/60 p-4 text-xs leading-relaxed text-ink-soft">
        <Play className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        <p>
          Las piezas de categoría <strong>General</strong> solo aparecen en «Todo». Para que el cliente pueda
          filtrarlas, asígnales una categoría concreta. El texto alternativo describe la imagen para personas que usan
          lector de pantalla.
        </p>
      </div>
    </div>
  );
}
