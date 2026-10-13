"use client";

import { ChevronUp, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ExtraRow } from "@/components/booking/extra-row";
import { SelectedExtras, type SelectedLine } from "@/components/booking/selected-extras";
import { BottomBar } from "@/components/ui/bottom-bar";
import { ButtonLink } from "@/components/ui/button";
import type { Extra } from "@/lib/api/catalog";
import { ApiError, api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { saveBookingDraft } from "@/lib/booking-draft";
import { bookingQuery } from "@/lib/booking-params";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { formatCount } from "@/lib/plural";

type Quote = components["schemas"]["Quote"];
type QuoteState =
  | { status: "loading" }
  | { status: "ok"; quote: Quote }
  | { status: "error"; message: string };

const QUOTE_DELAY_MS = 250;
const OTHER = "other";

type Props = {
  location: string;
  /** hall title, kept in the unfinished-booking hint */
  title: string;
  startsAt: string;
  endsAt: string;
  /** booking length in hours: the default and the maximum for every extra */
  hours: number;
  extras: Extra[];
  initial: Record<number, number>;
  /** server-rendered back link, step indicator and title */
  header: ReactNode;
  /** server-rendered hall and time card */
  summary: ReactNode;
};

/**
 * Step "equipment and services".
 * Desktop: catalog on the left, sticky summary with chosen items and the total on the right.
 * Mobile: one column, sticky category chips, the bottom bar opens the list of chosen items.
 */
export function ExtrasStep({ location, title, startsAt, endsAt, hours, extras, initial, header, summary }: Props) {
  const [selected, setSelected] = useState<Record<number, number>>(initial);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quote, setQuote] = useState<QuoteState>({ status: "loading" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abort = useRef<AbortController>(undefined);

  const categoryKey = (extra: Extra) => (extra.category ? String(extra.category.id) : OTHER);

  // Categories keep the order the backend sent them in; items without one go last as "Другое".
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const extra of extras) seen.set(categoryKey(extra), extra.category?.title ?? "Другое");
    return [...seen].map(([key, title]) => ({ key, title }));
  }, [extras]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return extras.filter(
      (extra) =>
        (category === "all" || categoryKey(extra) === category) &&
        (needle === "" || extra.title.toLowerCase().includes(needle)),
    );
  }, [extras, search, category]);

  const groups = useMemo(() => {
    const result: { key: string; title: string; items: Extra[] }[] = [];
    for (const extra of visible) {
      const key = categoryKey(extra);
      let group = result.find((g) => g.key === key);
      if (!group) {
        group = { key, title: extra.category?.title ?? "Другое", items: [] };
        result.push(group);
      }
      group.items.push(extra);
    }
    return result;
  }, [visible]);

  /** Debounced backend price. State changes only after the delay, so it is safe to call from an effect. */
  function runQuote(next: Record<number, number>) {
    clearTimeout(timer.current);
    abort.current?.abort();
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      abort.current = controller;
      try {
        const result = await api<Quote>("/bookings/quote/", {
          method: "POST",
          body: {
            location,
            starts_at: startsAt,
            ends_at: endsAt,
            extras: Object.entries(next).map(([id, h]) => ({ extra: Number(id), hours: h })),
          },
          signal: controller.signal,
        });
        setQuote({ status: "ok", quote: result });
      } catch (error) {
        if (controller.signal.aborted) return;
        setQuote({
          status: "error",
          message: error instanceof ApiError ? error.message : "Не удалось рассчитать стоимость",
        });
      }
    }, QUOTE_DELAY_MS);
  }

  useEffect(() => {
    saveBookingDraft({
      location,
      title,
      startsAt,
      endsAt,
      extras: Object.entries(initial).map(([id, h]) => ({ id: Number(id), hours: h })),
      step: "extras",
    });
    runQuote(initial);
    return () => {
      clearTimeout(timer.current);
      abort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: Record<number, number>) {
    setSelected(next);
    setQuote({ status: "loading" });
    runQuote(next);
    // keep the URL in sync so a refresh or the back button keeps the choice
    const items = Object.entries(next).map(([id, h]) => ({ id: Number(id), hours: h }));
    saveBookingDraft({ location, title, startsAt, endsAt, extras: items, step: "extras" });
    window.history.replaceState(null, "", `/booking?${bookingQuery({ location, startsAt, endsAt, extras: items })}`);
  }

  function remove(id: number) {
    const next = { ...selected };
    delete next[id];
    update(next);
  }

  function step(id: number, delta: -1 | 1) {
    update({ ...selected, [id]: Math.min(Math.max((selected[id] ?? 0) + delta, 1), hours) });
  }

  const count = Object.keys(selected).length;
  const amounts = new Map(quote.status === "ok" ? quote.quote.extras.map((line) => [line.extra, line.amount]) : []);
  const lines: SelectedLine[] = extras
    .filter((extra) => selected[extra.id])
    .map((extra) => ({ id: extra.id, title: extra.title, hours: selected[extra.id], amount: amounts.get(extra.id) }));
  const nextQuery = bookingQuery({
    location,
    startsAt,
    endsAt,
    extras: Object.entries(selected).map(([id, h]) => ({ id: Number(id), hours: h })),
  });

  const ready = quote.status === "ok";
  const total = ready ? formatMoney(quote.quote.total) : quote.status === "loading" ? "Считаем…" : "—";
  const nextButton = (
    <ButtonLink
      href={`/booking/checkout?${nextQuery}`}
      size="md"
      aria-disabled={!ready}
      tabIndex={ready ? undefined : -1}
    >
      Далее
    </ButtonLink>
  );
  const pickedByCategory = (key: string) =>
    extras.filter((extra) => selected[extra.id] && categoryKey(extra) === key).length;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-10">
      <div>
        {header}
        <p className="type-body-sm mt-3 max-w-xl text-muted">
          Необязательно. Допы считаются на все часы брони, количество часов можно уменьшить.
        </p>
        <div className="mt-5 lg:hidden">{summary}</div>

        <label className="mt-6 flex h-control items-center gap-3 rounded-pill border border-line bg-surface px-5 focus-within:border-accent">
          <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти: свет, фон, ассистент"
            aria-label="Поиск по оборудованию и услугам"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
        </label>

        {categories.length > 1 && (
          <div className="sticky top-[4.75rem] z-20 -mx-gutter mt-3 bg-page/85 px-gutter py-2 backdrop-blur-md lg:mx-0 lg:px-0">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
                Все
              </CategoryChip>
              {categories.map((item) => (
                <CategoryChip key={item.key} active={category === item.key} onClick={() => setCategory(item.key)}>
                  {item.title}
                  {pickedByCategory(item.key) > 0 && (
                    <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-pill bg-fg text-[0.6875rem] font-semibold text-page">
                      {pickedByCategory(item.key)}
                    </span>
                  )}
                </CategoryChip>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <p className="type-body-sm mt-10 text-center text-muted">Ничего не нашлось. Попробуйте другое слово.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`cat-${group.key}`}>
                <h2 id={`cat-${group.key}`} className="type-h4 mb-3">
                  {group.title}
                </h2>
                <ul className="grid gap-2.5 xl:grid-cols-2">
                  {group.items.map((extra) => (
                    <ExtraRow
                      key={extra.id}
                      extra={extra}
                      hours={selected[extra.id] ?? 0}
                      maxHours={hours}
                      amount={amounts.get(extra.id)}
                      onAdd={() => update({ ...selected, [extra.id]: hours })}
                      onStep={(delta) => step(extra.id, delta)}
                      onRemove={() => remove(extra.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* desktop: sticky summary */}
      <aside className="sticky top-24 hidden flex-col gap-5 rounded-card border border-line bg-surface p-5 lg:flex">
        {summary}
        <div>
          <h2 className="type-h4 mb-2">Допы</h2>
          <SelectedExtras lines={lines} onRemove={remove} />
        </div>
        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div
                className={cn("type-caption", quote.status === "error" ? "text-danger" : "text-muted")}
              >
                {quote.status === "error" ? quote.message : "Итого"}
              </div>
              <div className="type-price mt-0.5">{total}</div>
            </div>
            {nextButton}
          </div>
        </div>
      </aside>

      {/* mobile: bottom bar, the chosen items open above it */}
      <BottomBar
        outerClassName="mt-6 lg:hidden"
        above={
          sheetOpen && (
            <div className="glass max-h-[50dvh] overflow-y-auto rounded-panel p-4">
              <SelectedExtras lines={lines} onRemove={remove} />
            </div>
          )
        }
      >
        <button
          type="button"
          aria-expanded={sheetOpen}
          disabled={count === 0}
          onClick={() => setSheetOpen((value) => !value)}
          className="min-w-0 text-left disabled:cursor-default"
        >
          <div
            className={cn(
              "type-caption flex items-center gap-1 truncate",
              quote.status === "error" ? "text-danger" : "text-muted",
            )}
          >
            {quote.status === "error"
              ? quote.message
              : count === 0
                ? "Зал без допов"
                : `Допы: ${formatCount(count, ["позиция", "позиции", "позиций"])}`}
            {count > 0 && quote.status !== "error" && (
              <ChevronUp
                className={cn("size-3.5 shrink-0 transition-transform", sheetOpen && "rotate-180")}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="type-price mt-0.5">{total}</div>
        </button>
        {nextButton}
      </BottomBar>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-pill border px-4 text-sm transition-colors",
        active ? "border-fg bg-fg font-semibold text-page" : "border-line hover:border-fg/40 hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
