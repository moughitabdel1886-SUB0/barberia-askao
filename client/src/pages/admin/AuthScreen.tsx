import { Wordmark } from "@/components/site/brand";
import { btnAccent, inputClass } from "@/components/admin/ui";
import { setAdminToken } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import type { AdminUser } from "@/lib/types";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export function AuthScreen({
  mode,
  onAuthed,
}: {
  mode: "login" | "setup";
  onAuthed: (admin: AdminUser, token: string) => void;
}) {
  const [email, setEmail] = useState(mode === "setup" ? "barberiaaskao@gmail.com" : "");
  const [name, setName] = useState("Barbería Askao");
  const [setupToken, setSetupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const login = trpc.admin.login.useMutation({
    onSuccess: data => {
      setAdminToken(data.token);
      onAuthed(data.admin as AdminUser, data.token);
    },
  });

  const setup = trpc.admin.setup.useMutation({
    onSuccess: data => {
      setAdminToken(data.token);
      onAuthed(data.admin as AdminUser, data.token);
    },
  });

  const pending = login.isPending || setup.isPending;
  const serverError = login.error?.message || setup.error?.message;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    login.reset();
    setup.reset();

    if (!email.trim()) {
      setLocalError("Escribe tu email.");
      return;
    }
    if (!password) {
      setLocalError("Escribe tu contraseña.");
      return;
    }

    if (mode === "setup") {
      if (password.length < 10) {
        setLocalError("La contraseña debe tener al menos 10 caracteres.");
        return;
      }
      if (password !== confirm) {
        setLocalError("Las dos contraseñas no coinciden.");
        return;
      }
      if (!setupToken.trim()) {
        setLocalError("Escribe el token de primer acceso que aparece en los logs del servidor.");
        return;
      }
      setup.mutate({
        email: email.trim(),
        password,
        name: name.trim() || "Barbería Askao",
        setupToken: setupToken.trim(),
      });
    } else {
      login.mutate({ email: email.trim(), password });
    }
  };

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-cobalt to-cobalt-deep p-6 text-paper-soft sm:p-10 lg:p-14">
        <div className="stripe-rule absolute inset-x-0 top-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2">
            <Wordmark size="md" tone="light" className="text-paper-soft" />
          </Link>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-paper-soft/70">
            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            Acceso privado
          </p>
          <h1 className="mt-5 max-w-md font-display text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">
            La trastienda
            <span className="block font-light italic text-butter">de Askao.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper-soft/70 sm:text-base">
            Reservas, precios, horarios y galería. Todo lo que pasa en la barbería, en una sola pantalla.
          </p>
        </div>

        <div className="relative mt-10 hidden lg:block">
          <div className="mb-8 flex h-24 w-9 items-center justify-center rounded-full stripe-bg shadow-lift" aria-hidden="true">
            <span className="h-28 w-11 rounded-full border-2 border-white/40" />
          </div>
          <ul className="space-y-3 text-sm font-semibold text-paper-soft/80">
            <li className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-butter" aria-hidden="true" />
              Gestiona la agenda desde el móvil.
            </li>
            <li className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-butter" aria-hidden="true" />
              Cambia precios, horarios y fotos sin tocar código.
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-butter" aria-hidden="true" />
              Tus clientes solo ven lo que tú decides.
            </li>
          </ul>
        </div>

        <Link
          href="/"
          className="relative mt-8 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-paper-soft/60 transition hover:text-paper-soft"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver a la web
        </Link>
      </aside>

      <main className="flex items-center justify-center p-5 py-10 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Wordmark size="md" />
          </div>

          <p className="eyebrow">{mode === "setup" ? "Primer acceso" : "Acceso del equipo"}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl">
            {mode === "setup" ? (
              <>
                Crea la cuenta
                <span className="block font-light italic text-cobalt">del negocio.</span>
              </>
            ) : (
              <>
                Entra en
                <span className="block font-light italic text-cobalt">la trastienda.</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {mode === "setup"
              ? "Este formulario solo aparece una vez. Introduce el token de los logs, el email de Barbería Askao y una contraseña que solo conozcas tú."
              : "Introduce tu email y contraseña para gestionar citas, precios y contenido."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {mode === "setup" ? (
              <div>
                <label htmlFor="admin-name" className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">
                  Nombre visible
                </label>
                <input
                  id="admin-name"
                  autoComplete="organization"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                  placeholder="Barbería Askao"
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="admin-email" className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="barberiaaskao@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "setup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder={mode === "setup" ? "Mínimo 10 caracteres" : "Tu contraseña"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {mode === "setup" ? (
              <div>
                <label htmlFor="admin-setup-token" className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">
                  Token de primer acceso
                </label>
                <input
                  id="admin-setup-token"
                  autoComplete="one-time-code"
                  value={setupToken}
                  onChange={event => setSetupToken(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                  placeholder="Aparece en los logs del servidor"
                />
                <p className="mt-1.5 text-[0.65rem] leading-relaxed text-ink-faint">
                  También puedes definirlo en la variable ADMIN_SETUP_TOKEN.
                </p>
              </div>
            ) : null}

            {mode === "setup" ? (
              <div>
                <label htmlFor="admin-confirm" className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">
                  Repite la contraseña
                </label>
                <input
                  id="admin-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={event => setConfirm(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                  placeholder="Otra vez"
                />
              </div>
            ) : null}

            {localError || serverError ? (
              <p role="alert" className="rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion">
                {localError || serverError}
              </p>
            ) : null}

            <button type="submit" disabled={pending} className={`${btnAccent} mt-2 w-full`}>
              {pending ? "Comprobando…" : mode === "setup" ? "Crear cuenta y entrar" : "Entrar al panel"}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-paper-soft/70 p-3.5 text-[0.68rem] leading-relaxed text-ink-faint">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden="true" />
            <p>
              La contraseña se guarda cifrada con scrypt. La sesión caduca a los 30 días y puedes cerrarla desde
              cualquier dispositivo.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-ink-faint">
            ¿No eres del equipo?{" "}
            <Link href="/" className="font-bold text-cobalt underline decoration-cobalt/30 underline-offset-2">
              Vuelve a la web
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
