import { whatsappChatUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./icons";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappChatUrl("Olá! Gostaria de saber mais sobre os vossos produtos.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar connosco no WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-soft transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
