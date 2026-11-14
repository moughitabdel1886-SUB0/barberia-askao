import type { HoursConfig } from "@shared/booking";

export type PublicSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string | null;
  tiktok: string | null;
  mapsUrl: string;
  reviewsUrl: string;
  rating: number;
  reviewCount: number;
  hours: HoursConfig;
  slotMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
};

export type PublicService = {
  id: number;
  slug: string;
  nameEs: string;
  nameEn: string | null;
  nameFr: string | null;
  nameDe: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  descriptionDe: string | null;
  priceCents: number;
  durationMin: number;
  active: boolean;
  sortOrder: number;
};

export type PublicMedia = {
  id: number;
  url: string;
  storageKey: string | null;
  type: "image" | "video";
  title: string | null;
  alt: string | null;
  category: string;
  sortOrder: number;
};

export type PublicBooking = {
  id: number;
  reference: string;
  name: string;
  date: string;
  time: string;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  email: string | null;
};

export type AdminUser = {
  id: number;
  email: string;
  name: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type AdminBooking = {
  id: number;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  serviceId: number | null;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  bookingDate: string;
  bookingTime: string;
  notes: string | null;
  status: BookingStatus;
  locale: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminBlock = {
  id: number;
  date: string;
  time: string;
  reason: string | null;
  createdAt: Date;
};

export type AdminSettings = {
  id: number;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string | null;
  tiktok: string | null;
  mapsUrl: string;
  reviewsUrl: string;
  ratingTenths: number;
  reviewCount: number;
  hoursJson: HoursConfig;
  slotMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
  updatedAt: Date;
  rating: number;
  emailConfigured: boolean;
};

export type AdminEmail = {
  id: number;
  kind: string;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  createdAt: Date;
  sentAt: Date | null;
};
