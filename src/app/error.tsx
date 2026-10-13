"use client";

import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";

/** Something broke while rendering: offer a retry instead of a blank screen. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container narrow className="flex min-h-dvh flex-col items-start justify-center gap-5 py-16">
      <p className="type-eyebrow text-muted">Что-то пошло не так</p>
      <h1 className="type-h1">Не удалось показать страницу</h1>
      <p className="type-body max-w-md text-muted">
        Это временная ошибка. Попробуйте ещё раз, а если не получится, вернитесь на главную.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Button size="md" onClick={reset}>
          Попробовать снова
        </Button>
        <ButtonLink href="/" variant="secondary" size="md">
          На главную
        </ButtonLink>
      </div>
    </Container>
  );
}
