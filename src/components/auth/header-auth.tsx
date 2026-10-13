"use client";

import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

/** Header slot: a sign-in button for guests, a link to the account for signed-in clients. */
export function HeaderAuth() {
  const { user, openLogin } = useAuth();

  if (user === undefined) {
    // session is being checked: keep the slot's size so the header does not jump
    return <div className="h-touch w-24" aria-hidden="true" />;
  }

  if (user === null) {
    return (
      <Button variant="glass" size="sm" onClick={() => openLogin()}>
        Войти
      </Button>
    );
  }

  // The name comes first, the email only when there is no name.
  const label = user.name?.trim() || user.email;

  return (
    <Link
      href="/profile"
      className="glass inline-flex min-h-touch max-w-28 items-center gap-2 sm:max-w-40 rounded-pill px-3.5 text-sm font-semibold transition hover:bg-(--glass-hover)"
    >
      <UserIcon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
