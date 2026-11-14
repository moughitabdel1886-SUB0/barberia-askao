import {
  AdminCard,
  AdminSectionHeader,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Spinner,
  btnAccent,
  btnSecondary,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import { centsFromEuros, eurosFromCents, formatAdminMoney } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import type { PublicService } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FormState = {
  nameEs: string;
  nameEn: string;
  nameFr: string;
  nameDe: string;
  descriptionEs: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionDe: string;
  price: string;
  durationMin: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  nameEs: "",
  nameEn: "",
  nameFr: "",
  nameDe: "",
  descriptionEs: "",
  descriptionEn: "",
  descriptionFr: "",
  descriptionDe: "",
  price: "12,00",
  durationMin: "30",
  active: true,
};

function formFromService(service: PublicService): FormState {
  return {
    nameEs: service.nameEs,
    nameEn: service.nameEn ?? "",
    nameFr: service.nameFr ?? "",
    nameDe: service.nameDe ?? "",
    descriptionEs: service.descriptionEs ?? "",
    descriptionEn: service.descriptionEn ?? "",
    descriptionFr: service.descriptionFr ?? "",
    descriptionDe: service.descriptionDe ?? "",
    price: eurosFromCents(service.priceCents),
    durationMin: String(service.durationMin),
    active: service.active,
  };
}

export function ServicesAdmin() {
  const utils = trpc.useUtils();
  const servicesQuery = trpc.admin.services.list.useQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PublicService | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    utils.admin.services.list.invalidate();
    utils.site.bootstrap.invalidate();
  };

  const create = trpc.admin.services.create.useMutation({
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      toast.success("Servicio creado.");
    },
    onError: mutationError => setError(mutationError.message),
  });

  const update = trpc.admin.services.update.useMutation({
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      toast.success("Servicio actualizado.");
    },
    onError: mutationError => setError(mutationError.message),
  });

  const remove = trpc.admin.services.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Servicio eliminado. Las reservas antiguas conservan su precio.");
    },
    onError: mutationError => toast.error(mutationError.message),
  });

  const reorder = trpc.admin.services.reorder.useMutation({
    onSuccess: invalidate,
    onError: mutationError => toast.error(mutationError.message),
  });

  const services = servicesQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (service: PublicService) => {
    setEditing(service);
    setForm(formFromService(service));
    setError(null);
    setModalOpen(true);
  };

  const setField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm(current => ({ ...current, [key]: value }));
    setError(null);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.nameEs.trim()) {
      setError("El nombre en español es obligatorio.");
      return;
    }
    const priceCents = centsFromEuros(form.price);
    if (priceCents === null) {
      setError("El precio no es válido. Usa euros, por ejemplo 12,50.");
      return;
    }
    const durationMin = Number(form.durationMin);
    if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 180) {
      setError("La duración debe estar entre 15 y 180 minutos.");
      return;
    }

    const payload = {
      nameEs: form.nameEs.trim(),
      nameEn: form.nameEn.trim() || null,
      nameFr: form.nameFr.trim() || null,
      nameDe: form.nameDe.trim() || null,
      descriptionEs: form.descriptionEs.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      descriptionFr: form.descriptionFr.trim() || null,
      descriptionDe: form.descriptionDe.trim() || null,
      priceCents,
      durationMin,
      active: form.active,
    };

    if (editing) update.mutate({ id: editing.id, ...payload });
    else create.mutate(payload);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= services.length) return;
    const ids = services.map(service => service.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate({ ids });
  };

  const pending = create.isPending || update.isPending;

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Servicios y precios"
        description="La carta que ve el cliente. Cambia el precio o la duración y la web se actualiza al guardar."
        action={
          <button type="button" onClick={openCreate} className={btnAccent}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo servicio
          </button>
        }
      />

      {servicesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-paper-soft" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Scissors className="h-5 w-5" />}
          title="La carta está vacía"
          description="Añade el primer servicio para que los clientes puedan reservar."
          action={
            <button type="button" onClick={openCreate} className={btnAccent}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Añadir servicio
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {services.map((service, index) => (
            <AdminCard key={service.id} className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", !service.active && "opacity-60")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex flex-col gap-0.5">
                  <IconButton
                    label="Subir"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                    className="h-6 w-6 rounded-md"
                  >
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label="Bajar"
                    onClick={() => move(index, 1)}
                    disabled={index === services.length - 1 || reorder.isPending}
                    className="h-6 w-6 rounded-md"
                  >
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  </IconButton>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{service.nameEs}</h3>
                    {!service.active ? (
                      <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.1em] text-ink-faint">
                        Oculto
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-1 max-w-xl text-xs text-ink-soft">{service.descriptionEs || "Sin descripción"}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
                    <span>{formatAdminMoney(service.priceCents)}</span>
                    <span>{service.durationMin} min</span>
                    <span>{service.slug}</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => update.mutate({ id: service.id, active: !service.active })}
                  disabled={update.isPending}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[0.68rem] font-extrabold transition",
                    service.active
                      ? "bg-[#2f7d4e]/12 text-[#2f7d4e] hover:bg-[#2f7d4e]/20"
                      : "bg-paper-deep text-ink-soft hover:bg-line",
                  )}
                >
                  {service.active ? "Activo" : "Inactivo"}
                </button>
                <IconButton label="Editar" onClick={() => openEdit(service)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Eliminar"
                  className="hover:border-vermilion hover:text-vermilion"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${service.nameEs}" de la carta? Las reservas antiguas conservan su nombre y precio.`)) {
                      remove.mutate({ id: service.id });
                    }
                  }}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </IconButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-line bg-paper-soft/60 p-4 text-xs leading-relaxed text-ink-soft">
        Los servicios ocultos no aparecen en la web ni se pueden reservar, pero no se borran. Si eliminas uno, las
        reservas ya hechas mantienen su nombre y precio original.
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar servicio" : "Nuevo servicio"}
        description="Los campos en inglés, francés y alemán son opcionales; si faltan, se usa el español."
        wide
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre en español" htmlFor="service-name-es" required>
              <input
                id="service-name-es"
                value={form.nameEs}
                onChange={event => setField("nameEs", event.target.value)}
                className={inputClass}
                placeholder="Corte de pelo"
              />
            </Field>
            <Field label="Precio (€)" htmlFor="service-price" required>
              <input
                id="service-price"
                inputMode="decimal"
                value={form.price}
                onChange={event => setField("price", event.target.value)}
                className={inputClass}
                placeholder="12,00"
              />
            </Field>
          </div>

          <Field label="Descripción en español" htmlFor="service-description-es">
            <textarea
              id="service-description-es"
              rows={2}
              value={form.descriptionEs}
              onChange={event => setField("descriptionEs", event.target.value)}
              className={textareaClass}
              placeholder="Degradado, clásico o moderno…"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Duración" htmlFor="service-duration" required>
              <select
                id="service-duration"
                value={form.durationMin}
                onChange={event => setField("durationMin", event.target.value)}
                className={selectClass}
              >
                {[15, 30, 45, 60, 75, 90, 120].map(minutes => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutos
                  </option>
                ))}
              </select>
            </Field>
            <label className="mt-6 flex min-h-11 items-center gap-3 rounded-xl border border-line bg-paper px-3.5 text-sm font-bold text-ink">
              <input
                type="checkbox"
                checked={form.active}
                onChange={event => setField("active", event.target.checked)}
                className="h-5 w-5 rounded border-line accent-vermilion"
              />
              Visible en la web
            </label>
          </div>

          <div className="rounded-xl border border-line bg-paper/70 p-4">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-ink">Otros idiomas</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="English" htmlFor="service-name-en">
                <input id="service-name-en" value={form.nameEn} onChange={event => setField("nameEn", event.target.value)} className={inputClass} placeholder="Haircut" />
              </Field>
              <Field label="Français" htmlFor="service-name-fr">
                <input id="service-name-fr" value={form.nameFr} onChange={event => setField("nameFr", event.target.value)} className={inputClass} placeholder="Coupe de cheveux" />
              </Field>
              <Field label="Deutsch" htmlFor="service-name-de">
                <input id="service-name-de" value={form.nameDe} onChange={event => setField("nameDe", event.target.value)} className={inputClass} placeholder="Haarschnitt" />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Description EN" htmlFor="service-description-en">
                <textarea id="service-description-en" rows={2} value={form.descriptionEn} onChange={event => setField("descriptionEn", event.target.value)} className={textareaClass} />
              </Field>
              <Field label="Description FR" htmlFor="service-description-fr">
                <textarea id="service-description-fr" rows={2} value={form.descriptionFr} onChange={event => setField("descriptionFr", event.target.value)} className={textareaClass} />
              </Field>
              <Field label="Description DE" htmlFor="service-description-de">
                <textarea id="service-description-de" rows={2} value={form.descriptionDe} onChange={event => setField("descriptionDe", event.target.value)} className={textareaClass} />
              </Field>
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={pending} className={btnAccent}>
              {pending ? <Spinner /> : null}
              {editing ? "Guardar cambios" : "Crear servicio"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
