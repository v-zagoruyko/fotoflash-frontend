"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type User = components["schemas"]["User"];

/** email → code → (new client: name + consent) | (known client without a name: name) → done */
type Phase = "email" | "code" | "details" | "name";

/**
 * Sign-in by emailed code. It is shared by the header modal and the checkout.
 * The code is confirmed first; only if the backend says the client is new (`consent_required`)
 * the name and the consent are asked, and a known client without a name is asked for it afterwards.
 */
export function LoginPanel({
  consentUrl,
  onLoggedIn,
  bare,
}: {
  consentUrl?: string;
  onLoggedIn: (user: User) => void;
  /** no card frame, for use inside a modal */
  bare?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [signedIn, setSignedIn] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? firstMessage(e) : "Что-то пошло не так, попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  const requestCode = () =>
    run(async () => {
      await api("/auth/code/request/", { method: "POST", body: { email: email.trim() } });
      setPhase("code");
    });

  const verify = () =>
    run(async () => {
      try {
        const user = await api<User>("/auth/code/verify/", {
          method: "POST",
          body: {
            email: email.trim(),
            code: code.trim(),
            ...(phase === "details" ? { name: name.trim(), consent: true } : {}),
          },
        });
        if (user.name?.trim()) onLoggedIn(user);
        else {
          setSignedIn(user);
          setPhase("name");
        }
      } catch (e) {
        // a new client: ask for the name and the consent, the same code is still valid
        if (e instanceof ApiError && e.code === "consent_required") {
          setPhase("details");
          return;
        }
        throw e;
      }
    });

  const saveName = () =>
    run(async () => {
      const user = await api<User>("/me/", { method: "PATCH", body: { name: name.trim() } });
      onLoggedIn(user);
    });

  const submit =
    phase === "email" ? requestCode : phase === "code" || phase === "details" ? verify : saveName;

  const disabled =
    busy ||
    (phase === "email" && !email) ||
    (phase === "code" && code.length < 6) ||
    (phase === "details" && (!name.trim() || !consent)) ||
    (phase === "name" && !name.trim());

  return (
    <section className={bare ? "pr-8" : "rounded-panel border border-line bg-surface p-4"}>
      <h2 className="type-h4">{phase === "name" ? "Как к вам обращаться?" : "Вход"}</h2>
      <p className="type-body-sm mt-1.5 text-muted">
        {phase === "details"
          ? "Похоже, вы у нас впервые. Расскажите, как к вам обращаться."
          : phase === "name"
            ? "Мы будем использовать имя в письмах и личном кабинете."
            : "Пароль не нужен: пришлём код на почту. Так бронь окажется в вашем личном кабинете."}
      </p>

      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {(phase === "email" || phase === "code") && (
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={phase === "code" || busy}
            required
          />
        )}

        {phase === "details" && <p className="type-caption text-muted">Почта: {email}</p>}

        {phase === "code" && (
          <Field
            label="Код из письма"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6 цифр"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            hint="Код действует 10 минут"
            autoFocus
            required
          />
        )}

        {(phase === "details" || phase === "name") && (
          <Field
            label="Как к вам обращаться"
            autoComplete="name"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        )}

        {phase === "details" && (
          <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)}>
            Согласен на{" "}
            {consentUrl ? (
              <a href={consentUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                обработку персональных данных
              </a>
            ) : (
              "обработку персональных данных"
            )}
          </Checkbox>
        )}

        {error && <p className="type-body-sm text-danger">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="md" disabled={disabled}>
            {phase === "email" ? "Получить код" : phase === "name" ? "Сохранить" : phase === "details" ? "Продолжить" : "Войти"}
          </Button>
          {phase === "name" && signedIn && (
            <button
              type="button"
              className="type-body-sm min-h-touch font-semibold text-muted transition-colors hover:text-fg"
              onClick={() => onLoggedIn(signedIn)}
            >
              Пропустить
            </button>
          )}
          {(phase === "code" || phase === "details") && (
            <button
              type="button"
              className="type-body-sm min-h-touch font-semibold text-accent"
              onClick={() => {
                setPhase("email");
                setCode("");
                setConsent(false);
                setError(null);
              }}
            >
              Изменить email
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

/** Field validation errors arrive as `{field: [msg]}`; show the first message. */
function firstMessage(error: ApiError) {
  const field = error.fields && Object.values(error.fields)[0];
  return field?.[0] ?? error.message;
}
