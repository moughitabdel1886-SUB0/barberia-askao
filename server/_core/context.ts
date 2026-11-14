import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getRequestAdmin, type AdminPublic } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  admin: AdminPublic | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let admin: AdminPublic | null = null;

  try {
    admin = await getRequestAdmin(opts.req);
  } catch (error) {
    // A broken or expired session is simply logged out.
    console.warn("[auth] Could not resolve admin session:", error);
  }

  return {
    req: opts.req,
    res: opts.res,
    admin,
  };
}
