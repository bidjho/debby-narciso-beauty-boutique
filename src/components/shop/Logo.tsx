import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-oficial-debby-narciso.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label="Debby Narciso Cosmetics — início">
      <img
        src={logo.url}
        alt="Debby Narciso Cosmetics"
        width={1244}
        height={606}
        className="h-11 w-auto object-contain md:h-12"
      />
    </Link>
  );
}
