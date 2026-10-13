import { Container } from "@/components/layout/container";
import { Logo } from "@/components/ui/logo";
import { getDocuments, getStudio } from "@/lib/api/catalog";
import { sortDocuments } from "@/lib/documents";

const docLink = "flex min-h-9 items-center transition-colors hover:text-fg md:min-h-7";

export async function SiteFooter() {
  const [documents, studio] = await Promise.all([getDocuments(), getStudio()]);
  const { address, phone, email, legal_name, inn, ogrnip, legal_address } = studio;

  // Seller details are required on a site that sells services online; show whatever is set.
  const legal = [legal_name, inn && `ИНН ${inn}`, ogrnip && `ОГРНИП ${ogrnip}`, legal_address].filter(Boolean);

  return (
    <footer className="mt-10 border-t border-line py-8 md:py-10">
      <Container>
        <div className="grid gap-7 md:grid-cols-[auto_1fr_1.4fr] md:gap-12">
          <Logo className="self-start" />

          {(phone || email || address) && (
            <div className="flex flex-col gap-1.5">
              {phone && (
                <a
                  href={`tel:+${phone.replace(/\D/g, "")}`}
                  className="type-h4 transition-opacity hover:opacity-70"
                >
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="type-body transition-opacity hover:opacity-70">
                  {email}
                </a>
              )}
              {address && <p className="type-body-sm text-muted">{address}</p>}
            </div>
          )}

          {documents.length > 0 && (
            <nav aria-label="Документы">
              <ul className="type-caption text-muted md:grid md:grid-cols-2 md:gap-x-8">
                {sortDocuments(documents).map((doc) => (
                  <li key={doc.slug}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className={docLink}>
                      {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="type-caption mt-6 flex flex-col gap-1.5 border-t border-line pt-5 text-muted md:flex-row md:justify-between">
          <span>© ФОТОФЛЕШ</span>
          {legal.length > 0 && <span className="md:max-w-xl md:text-right">{legal.join(" · ")}</span>}
        </div>
      </Container>
    </footer>
  );
}
