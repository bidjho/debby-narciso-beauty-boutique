import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, MessageCircle, Phone, Store, Truck } from "lucide-react";
import { getHomeData } from "@/lib/catalog.functions";
import { formatStorePhone, instagramUrl } from "@/lib/site-content";
import { storageImageUrl } from "@/lib/images";
import { useSite } from "@/lib/use-site";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shop/EmptyState";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { InstagramIcon, WhatsAppIcon } from "@/components/shop/icons";
import heroImg from "@/assets/gloss-colecao.webp.asset.json";
import modelsImg from "@/assets/tres-modelos.webp.asset.json";
import displayImg from "@/assets/produtos-rosa.webp.asset.json";
import storeImg from "@/assets/loja-debby-narciso.webp.asset.json";
import lipstickImg from "@/assets/modelo-batom.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Debby Narciso Cosméticos — Loja de beleza em Nampula, Moçambique" },
      { name: "description", content: "Batons, gloss, paletas e muito mais. Loja física no Cadri Shopping, Nampula. Encomende pelo WhatsApp com entregas para todas as províncias." },
      { property: "og:title", content: "Debby Narciso Cosméticos — Loja de beleza em Nampula" },
      { property: "og:description", content: "Encomende os seus cosméticos pelo WhatsApp. Entregas para todas as províncias de Moçambique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getHomeData(),
  errorComponent: HomeError,
  component: HomePage,
});

function HomeError() {
  const router = useRouter();
  return (
    <div className="container-shop py-12">
      <EmptyState title="Não foi possível carregar a página" description="Verifique a sua ligação e tente novamente." action={<Button onClick={() => router.invalidate()}>Tentar novamente</Button>} />
    </div>
  );
}

function HomePage() {
  const data = Route.useLoaderData();
  const { hero, benefits, editorial, contact } = useSite();
  const wa = contact.whatsappNumber;
  const benefitIcons = [Store, MessageCircle, Truck];

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="container-shop grid items-center gap-8 pb-12 pt-4 md:grid-cols-2 md:gap-12 md:py-16">
          <div className="relative order-1 overflow-hidden rounded-[2rem] md:order-2">
            <img src={storageImageUrl(hero.imagePath) ?? heroImg.url} alt="Coleção de gloss Debby Narciso Cosmetics" width={1120} height={1400} fetchPriority="high" className="aspect-[4/5] w-full object-cover md:aspect-[5/6]" />
            {hero.badge && (
              <div className="absolute bottom-4 left-4 rounded-full bg-card/90 px-4 py-2 text-xs font-medium backdrop-blur">
                <MapPin className="mr-1 inline size-3.5 text-primary" aria-hidden />
                {hero.badge}
              </div>
            )}
          </div>
          <div className="order-2 animate-rise md:order-1">
            <p className="eyebrow text-gold">{hero.eyebrow}</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[0.95] md:text-7xl">
              {hero.titleLine1}
              {hero.titleHighlight && (
                <>
                  <br />
                  <em className="text-gradient-brand font-medium">{hero.titleHighlight}</em>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/loja">Comprar agora <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={whatsappChatUrl(undefined, wa)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="text-whatsapp" /> Falar connosco
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {data.categories.length > 0 && (
        <section className="container-shop py-10">
          <SectionHeading eyebrow="Explore" title="Categorias" />
          <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-6">
            {data.categories.map((c) => (
              <Link key={c.id} to="/loja" search={{ categoria: c.slug }} className="group w-36 shrink-0 snap-start md:w-auto">
                <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-blush">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center font-display text-2xl text-cocoa/80">{c.name}</div>
                  )}
                </div>
                <p className="mt-2 text-center text-sm font-medium group-hover:text-primary">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.featured.length > 0 && (
        <section className="container-shop py-10">
          <SectionHeading eyebrow="Escolhas da loja" title="Destaques" action={<ViewAll />} />
          <ProductGrid products={data.featured} />
        </section>
      )}

      {data.promos.length > 0 && (
        <section className="bg-gradient-blush py-14">
          <div className="container-shop">
            <SectionHeading eyebrow="Por tempo limitado" title="Promoções" action={<ViewAll />} />
            <ProductGrid products={data.promos} />
          </div>
        </section>
      )}

      {data.newest.length > 0 && (
        <section className="container-shop py-10">
          <SectionHeading eyebrow="Acabados de chegar" title="Novidades" action={<ViewAll />} />
          <ProductGrid products={data.newest} />
        </section>
      )}

      {data.total === 0 && (
        <section className="container-shop py-10">
          <div className="grid overflow-hidden rounded-[2rem] bg-cocoa text-cocoa-foreground md:grid-cols-2">
            <img src={displayImg.url} alt="Produtos Debby Narciso Cosmetics" loading="lazy" className="aspect-square h-full w-full object-cover" />
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="eyebrow text-gold">Catálogo online</p>
              <h2 className="mt-2 text-4xl font-semibold">Os nossos produtos estão a chegar à loja online</h2>
              <p className="mt-4 text-cocoa-foreground/75">Enquanto isso, fale connosco pelo WhatsApp ou visite-nos no Cadri Shopping.</p>
              <div className="mt-6">
                <Button asChild variant="whatsapp" size="lg">
                  <a href={whatsappChatUrl("Olá! Gostaria de saber que produtos têm disponíveis.", wa)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon /> Perguntar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="container-shop py-14" aria-label="Vantagens">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((b, i) => ({ ...b, icon: benefitIcons[i] ?? Store })).map((b, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <b.icon className="size-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-sans text-base font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand editorial */}
      <section className="container-shop py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          <img src={storageImageUrl(editorial.image1Path) ?? modelsImg.url} alt="Maquilhagem Debby Narciso em diferentes tons de pele" loading="lazy" className="col-span-1 aspect-[4/5] h-full w-full rounded-2xl object-cover md:row-span-2 md:aspect-auto" />
          <div className="col-span-1 flex flex-col justify-center rounded-2xl bg-gradient-brand p-6 text-primary-foreground md:col-span-2 md:p-10">
            {editorial.eyebrow && <p className="eyebrow opacity-80">{editorial.eyebrow}</p>}
            <p className="mt-2 font-display text-3xl leading-tight md:text-5xl">{editorial.text}</p>
          </div>
          <img src={storageImageUrl(editorial.image2Path) ?? lipstickImg.url} alt="Modelo com batom Debby Narciso" loading="lazy" className="col-span-2 aspect-[3/2] w-full rounded-2xl object-cover md:col-span-2" />
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="container-shop scroll-mt-24 py-14">
        <div className="grid overflow-hidden rounded-[2rem] bg-card shadow-soft md:grid-cols-2">
          <img src={storageImageUrl(contact.storeImagePath) ?? storeImg.url} alt="Loja Debby Narciso Cosmetics no Cadri Shopping" loading="lazy" className="aspect-[4/5] h-full w-full object-cover md:aspect-auto" />
          <div className="p-7 md:p-12">
            <p className="eyebrow text-gold">Contacto</p>
            <h2 className="mt-2 text-4xl font-semibold">Visite a nossa loja</h2>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-primary" aria-hidden /><span>{contact.address}<br />{contact.city}</span></li>
              <li className="flex gap-3"><Clock className="size-5 shrink-0 text-primary" aria-hidden /><span>{contact.hours.map((h, i) => (<span key={i} className="block">{h.days}: {h.time}</span>))}</span></li>
              <li className="flex gap-3"><Phone className="size-5 shrink-0 text-primary" aria-hidden /><span>WhatsApp {formatStorePhone(wa)}<br />Telefone {formatStorePhone(contact.altPhone)}</span></li>
              <li className="flex gap-3"><Truck className="size-5 shrink-0 text-primary" aria-hidden /><span>{contact.delivery}</span></li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="whatsapp">
                <a href={whatsappChatUrl(undefined, wa)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> WhatsApp</a>
              </Button>
              <Button asChild variant="outline">
                <a href={`tel:+${contact.altPhone}`}><Phone /> Ligar</a>
              </Button>
              <Button asChild variant="outline">
                <a href={instagramUrl(contact.instagram)} target="_blank" rel="noopener noreferrer"><InstagramIcon /> Instagram</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ViewAll() {
  return (
    <Link to="/loja" className="eyebrow shrink-0 text-primary hover:underline">
      Ver tudo
    </Link>
  );
}
