import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Studio } from "@/lib/api/catalog";

type Item = { icon: LucideIcon; label: string; value: string; href?: string };

/** Empty string from the API means "not set": that item is skipped, and with no contacts at all the block is hidden. */
export function Contacts({ studio, openTime, closeTime }: { studio: Studio; openTime: string; closeTime: string }) {
  const { address, phone, email, map_url } = studio;
  if (!address && !phone && !email) return null;

  const items: Item[] = [
    address && { icon: MapPin, label: "Адрес", value: address },
    phone && { icon: Phone, label: "Телефон", value: phone, href: `tel:+${phone.replace(/\D/g, "")}` },
    email && { icon: Mail, label: "Почта", value: email, href: `mailto:${email}` },
    { icon: Clock, label: "Ежедневно", value: `${openTime}–${closeTime}` },
  ].filter((item): item is Item => Boolean(item));

  return (
    <section>
      <Container className="grid gap-y-7 md:grid-cols-[1fr_auto] md:items-end">
        <SectionHeading eyebrow="Контакты" title="Как нас найти" />
        {map_url && (
          <ButtonLink
            href={map_url}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="md"
            className="order-3 w-full md:order-none md:w-auto"
          >
            Открыть на карте
          </ButtonLink>
        )}
        <dl className="grid gap-6 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 md:col-span-2 md:p-8 lg:grid-cols-[1.35fr_1fr_1.1fr_1fr] lg:gap-8">
          {items.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex flex-col gap-2">
              <dt className="type-caption flex items-center gap-2 text-muted">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </dt>
              <dd className="type-title md:text-lg">
                {href ? (
                  <a href={href} className="transition-opacity hover:opacity-70">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
