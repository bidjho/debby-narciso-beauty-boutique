import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatStorePhone } from "@/lib/site-content";
import { useSite } from "@/lib/use-site";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./icons";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/loja", label: "Loja" },
] as const;

export function SiteHeader() {
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { contact } = useSite();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate({ to: "/loja", search: term ? { q: term } : {} });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="container-shop flex h-16 items-center gap-3 md:h-20">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button type="button" className="-ml-2 flex size-10 items-center justify-center rounded-full hover:bg-accent md:hidden" aria-label="Abrir menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm bg-background">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">Menu</SheetTitle>
            </SheetHeader>
            <form onSubmit={submit} className="mt-2 px-4">
              <label htmlFor="mobile-search" className="sr-only">Pesquisar produtos</label>
              <div className="flex h-11 items-center gap-2 rounded-full border border-input bg-card px-4">
                <Search className="size-4 text-muted-foreground" aria-hidden />
                <input id="mobile-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar produtos" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </form>
            <nav className="mt-6 flex flex-col px-4" aria-label="Principal">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className="border-b border-border py-4 font-display text-2xl" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
                  {n.label}
                </Link>
              ))}
              <Link to="/carrinho" onClick={() => setMenuOpen(false)} className="border-b border-border py-4 font-display text-2xl" activeProps={{ className: "text-primary" }}>
                Carrinho {ready && count > 0 ? `(${count})` : ""}
              </Link>
            </nav>
            <div className="mt-8 space-y-2 px-4 text-sm text-muted-foreground">
              <a href={whatsappChatUrl(undefined, contact.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground">
                <WhatsAppIcon className="size-4 text-whatsapp" /> {formatStorePhone(contact.whatsappNumber)}
              </a>
              <p>{contact.address}, {contact.city}</p>
            </div>
          </SheetContent>
        </Sheet>

        <Logo className="mx-auto md:mx-0" />

        <nav className="ml-10 hidden items-center gap-8 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="eyebrow text-foreground/80 hover:text-primary" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
              {n.label}
            </Link>
          ))}
          <a href="/#contacto" className="eyebrow text-foreground/80 hover:text-primary">Contacto</a>
        </nav>

        <div className="flex items-center gap-1 md:ml-auto">
          <form onSubmit={submit} className={searchOpen ? "hidden items-center md:flex" : "hidden"} role="search">
            <label htmlFor="desktop-search" className="sr-only">Pesquisar produtos</label>
            <input ref={inputRef} id="desktop-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar produtos" className="h-10 w-56 rounded-full border border-input bg-card px-4 text-sm outline-none focus:border-primary" />
          </form>
          <button
            type="button"
            onClick={() => (window.matchMedia("(min-width: 768px)").matches ? setSearchOpen((v) => !v) : setMenuOpen(true))}
            className="flex size-10 items-center justify-center rounded-full hover:bg-accent"
            aria-label={searchOpen ? "Fechar pesquisa" : "Pesquisar"}
          >
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <Link to="/carrinho" className="relative flex size-10 items-center justify-center rounded-full hover:bg-accent" aria-label={`Carrinho${ready ? `, ${count} artigo${count === 1 ? "" : "s"}` : ""}`}>
            <ShoppingBag className="size-5" />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
