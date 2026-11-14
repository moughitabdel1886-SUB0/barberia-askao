import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { CSRF_HEADER } from "../auth";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

function hasCsrfHeader(ctx: TrpcContext): boolean {
  return ctx.req.headers[CSRF_HEADER] === "1";
}

/** Login and first-run setup: cross-site form posts cannot set this header. */
export const sensitiveProcedure = t.procedure.use(
  t.middleware(async opts => {
    if (!hasCsrfHeader(opts.ctx)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Petición no válida." });
    }
    return opts.next();
  }),
);

const requireAdmin = t.middleware(async opts => {
  const { ctx, type } = opts;

  if (!ctx.admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Inicia sesión para continuar." });
  }

  if (type === "mutation" && !hasCsrfHeader(ctx)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Petición no válida." });
  }

  return opts.next({
    ctx: {
      ...ctx,
      admin: ctx.admin,
    },
  });
});

export const adminProcedure = t.procedure.use(requireAdmin);
