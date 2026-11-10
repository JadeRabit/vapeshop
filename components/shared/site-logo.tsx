import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  /** Size, radius, and background overrides for the image frame. */
  className?: string;
  /** Padding and fit overrides for the image itself. */
  imageClassName?: string;
  /** Set on the logo instance rendered above the fold. */
  priority?: boolean;
  /** Label the image for screen readers when it is not next to the brand name. */
  labelled?: boolean;
};

/**
 * Brand logo frame. Drop a replacement image at `public/logo.png` (or change
 * `siteConfig.logo`) to update the mark everywhere it is used.
 */
export function SiteLogo({
  className,
  imageClassName,
  priority = false,
  labelled = false,
}: SiteLogoProps) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]",
        className,
      )}
      aria-hidden={labelled ? undefined : true}
    >
      <Image
        src={siteConfig.logo}
        alt={labelled ? `${siteConfig.name} logo` : ""}
        width={128}
        height={128}
        priority={priority}
        className={cn("size-full object-contain p-1", imageClassName)}
      />
    </span>
  );
}
