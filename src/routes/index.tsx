import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, MessageCircle, Phone, Store, Truck } from "lucide-react";
import { getHomeData } from "@/lib/catalog.functions";
import { STORE } from "@/lib/store-config";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
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
      { title: "Debby Narciso Cosmetics — Cosméticos em Nampula, Moçambique" },
      { name: "description", content: "Batons, gloss, paletas e muito mais. Loja física no Cadri Shopping, Nampula. Encomende pelo WhatsApp com entregas para todas as províncias." },
      { property: "og:title", content: "Debby Narciso Cosmetics — Cosméticos em Nampula" },
      { property: "og:description", content: "Encomende os seus cosméticos pelo WhatsApp. Entregas para todas as províncias de Moçambique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getHomeData(),
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="container-shop grid items-center gap-8 pb-12 pt-4 md:grid-cols-2 md:gap-12 md:py-16">
          <div className="relative order-1 overflow-hidden rounded-[2rem] md:order-2">
            <img src={heroImg.url} alt="Coleção de gloss Debby Narciso Cosmetics" width={1120} height={1400} fetchPriority="high" className="aspect-[4/5] w-full object-cover md:aspect-[5/6]" />
            <div className="absolute bottom-4 left-4 rounded-full bg-card/90 px-4 py-2 text-xs font-medium backdrop-blur">
              <MapPin className="mr-1 inline size-3.5 text-primary" aria-hidden />
              Cadri Shopping · Nampula
            </div>
          </div>
          <div className="order-2 animate-rise md:order-1">
            <p className="eyebrow text-gold">Debby Narciso Cosmetics</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[0.95] md:text-7xl">
              A sua beleza,<br />
              <em className="text-gradient-brand font-medium">com assinatura.</em>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Cosméticos escolhidos com carinho em Nampula. Escolha os seus favoritos e encomende diretamente pelo WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/loja">Comprar agora <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={whatsappChatUrl()} target="_blank" rel="noopener noreferrer">
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
                  <a href={whatsappChatUrl("Olá! Gostaria de saber que produtos têm disponíveis.")} target="_blank" rel="noopener noreferrer">
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
          {[
            { icon: Store, title: "Loja física em Nampula", text: `${STORE.address}. Venha experimentar e conhecer-nos.` },
            { icon: MessageCircle, title: "Encomendas pelo WhatsApp", text: "Escolha os produtos, envie a encomenda e confirmamos consigo." },
            { icon: Truck, title: "Entregas em todo o país", text: "Enviamos para todas as províncias de Moçambique." },
          ].map((b) => (
            <div key={b.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
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
          <img src={modelsImg.url} alt="Maquilhagem Debby Narciso em diferentes tons de pele" loading="lazy" className="col-span-1 aspect-[4/5] h-full w-full rounded-2xl object-cover md:row-span-2 md:aspect-auto" />
          <div className="col-span-1 flex flex-col justify-center rounded-2xl bg-gradient-brand p-6 text-primary-foreground md:col-span-2 md:p-10">
            <p className="eyebrow opacity-80">Feito para si</p>
            <p className="mt-2 font-display text-3xl leading-tight md:text-5xl">Cores que realçam todos os tons de pele.</p>
          </div>
          <img src={lipstickImg.url} alt="Modelo com batom Debby Narciso" loading="lazy" className="col-span-2 aspect-[3/2] w-full rounded-2xl object-cover md:col-span-2" />
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="container-shop scroll-mt-24 py-14">
        <div className="grid overflow-hidden rounded-[2rem] bg-card shadow-soft md:grid-cols-2">
          <img src={storeImg.url} alt="Loja Debby Narciso Cosmetics no Cadri Shopping" loading="lazy" className="aspect-[4/5] h-full w-full object-cover md:aspect-auto" />
          <div className="p-7 md:p-12">
            <p className="eyebrow text-gold">Contacto</p>
            <h2 className="mt-2 text-4xl font-semibold">Visite a nossa loja</h2>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-primary" aria-hidden /><span>{STORE.address}<br />{STORE.city}</span></li>
              <li className="flex gap-3"><Clock className="size-5 shrink-0 text-primary" aria-hidden /><span>{STORE.hours.map((h) => (<span key={h.days} className="block">{h.days}: {h.time}</span>))}</span></li>
              <li className="flex gap-3"><Phone className="size-5 shrink-0 text-primary" aria-hidden /><span>WhatsApp {STORE.whatsappDisplay}<br />Telefone {STORE.altPhoneDisplay}</span></li>
              <li className="flex gap-3"><Truck className="size-5 shrink-0 text-primary" aria-hidden /><span>{STORE.delivery}</span></li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="whatsapp">
                <a href={whatsappChatUrl()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> WhatsApp</a>
              </Button>
              <Button asChild variant="outline">
                <a href={`tel:${STORE.altPhone}`}><Phone /> Ligar</a>
              </Button>
              <Button asChild variant="outline">
                <a href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramIcon /> Instagram</a>
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
