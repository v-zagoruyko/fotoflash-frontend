"use client";

import "./globals.css";

/** The root layout itself failed: no providers, no fonts, only a way to try again. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col items-start justify-center gap-5 bg-page p-8 text-fg">
        <h1 className="type-h1">Сайт временно недоступен</h1>
        <p className="type-body max-w-md text-muted">Мы уже знаем о проблеме. Попробуйте обновить страницу чуть позже.</p>
        <button type="button" onClick={reset} className="h-control rounded-pill bg-accent px-6 font-semibold text-on-accent">
          Обновить
        </button>
      </body>
    </html>
  );
}
