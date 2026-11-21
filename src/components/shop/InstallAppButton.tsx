import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * "Instalar app" button. Shows only when the browser can install the site (Android/desktop
 * Chrome/Edge) or on iPhone/iPad Safari, where it explains "Partilhar → Adicionar ao ecrã principal".
 * Hidden when the site is already open as an installed app.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent;
    setIsIos(/iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!promptEvent && !isIos)) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      setPromptEvent(null);
      if (outcome === "accepted") toast.success("App instalada! Encontre-a no seu ecrã principal.");
      return;
    }
    toast("Instalar no iPhone", {
      description: "No Safari, toque em Partilhar (quadrado com seta) e depois em «Adicionar ao ecrã principal».",
      duration: 10000,
    });
  }

  return (
    <button
      type="button"
      onClick={install}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-current/20 px-4 text-sm font-medium hover:border-primary hover:text-primary",
        className,
      )}
    >
      <Download className="size-4" aria-hidden /> Instalar app
    </button>
  );
}
