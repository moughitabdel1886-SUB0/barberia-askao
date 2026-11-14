export const ADMIN_TABS = [
  { id: "overview", label: "Resumen" },
  { id: "bookings", label: "Reservas" },
  { id: "services", label: "Servicios" },
  { id: "media", label: "Galería" },
  { id: "schedule", label: "Horario" },
  { id: "settings", label: "Ajustes" },
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number]["id"];
