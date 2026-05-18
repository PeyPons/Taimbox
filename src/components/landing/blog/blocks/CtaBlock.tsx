import { Button } from "@/components/ui/button";
import { LocaleLink } from "../LocaleLink";
import type { CtaBlock as CtaBlockType } from "@/lib/blog/blockSchema";

const VARIANT_CLASS: Record<CtaBlockType["variant"], string> = {
  primary:
    "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-sky-500/30 rounded-xl transition-all duration-300 hover:scale-105",
  secondary:
    "bg-white/10 hover:bg-white/15 text-white px-10 py-6 text-lg font-bold rounded-xl border border-white/20 transition-all duration-300",
};

function isStaticAssetHref(href: string): boolean {
  return href.startsWith("/recursos/") || /\.(xlsx|xls|pdf|zip)$/i.test(href);
}

export function CtaBlock({ block }: { block: CtaBlockType }) {
  const button = (
    <Button size="lg" className={VARIANT_CLASS[block.variant]}>
      {block.text}
    </Button>
  );

  return (
    <div className="text-center my-10">
      {isStaticAssetHref(block.href) ? (
        <a href={block.href} download>
          {button}
        </a>
      ) : (
        <LocaleLink to={block.href}>{button}</LocaleLink>
      )}
    </div>
  );
}
