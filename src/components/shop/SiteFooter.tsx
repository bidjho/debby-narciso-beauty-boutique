import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import { STORE } from "@/lib/store-config";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { InstagramIcon, WhatsAppIcon } from "./icons";
import logo from "@/assets/logo-oficial-debby-narciso.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-cocoa text-cocoa-foreground">
      <div className="container-shop grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <img src={logo.url} alt="Debby Narciso Cosmetics" width={1244} height={606} loading="lazy" className="h-16 w-auto" />
          <p className="mt-4 text-sm text-cocoa-foreground/70">Cosméticos em Nampula, com entregas para todas as províncias de Moçambique.</p>
        </div>
        <div>
          <h3 className="eyebrow mb-4 text-gold">Visite-nos</h3>
          <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{STORE.address}<br />{STORE.city}</p>
        </div>
        <div>
          <h3 className="eyebrow mb-4 text-gold">Horário</h3>
          <ul className="space-y-1 text-sm">
            {STORE.hours.map((h) => (
              <li key={h.days} className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{h.days}: {h.time}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4 text-gold">Contacto</h3>
          <ul className="space-y-2 text-sm">
            <li><a className="flex items-center gap-2 hover:text-coral" href={whatsappChatUrl()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="size-4" /> {STORE.whatsappDisplay}</a></li>
            <li><a className="flex items-center gap-2 hover:text-coral" href={`tel:${STORE.altPhone}`}><Phone className="size-4" aria-hidden /> {STORE.altPhoneDisplay}</a></li>
            <li><a className="flex items-center gap-2 hover:text-coral" href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramIcon className="size-4" /> @{STORE.instagram}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cocoa-foreground/10">
        <div className="container-shop flex flex-col gap-2 py-5 text-xs text-cocoa-foreground/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.</p>
          <Link to="/loja" className="hover:text-coral">Ver todos os produtos</Link>
        </div>
      </div>
    </footer>
  );
}
