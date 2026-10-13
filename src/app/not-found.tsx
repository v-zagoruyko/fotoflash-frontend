import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <Container narrow className="flex flex-col items-start gap-5 py-16 md:py-24">
        <p className="type-eyebrow text-muted">Ошибка 404</p>
        <h1 className="type-h1">Такой страницы нет</h1>
        <p className="type-body max-w-md text-muted">
          Возможно, ссылка устарела или в адресе опечатка. Вернитесь на главную или сразу выберите зал.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <ButtonLink href="/halls" size="md">
            Выбрать зал
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="md">
            На главную
          </ButtonLink>
        </div>
      </Container>
    </PageShell>
  );
}
