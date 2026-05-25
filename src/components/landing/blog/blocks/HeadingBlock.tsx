import {
  AlertTriangle,
  BarChart3,
  Brain,
  Calculator,
  CalendarClock,
  Clock,
  GitBranch,
  Layers,
  ListChecks,
  Scale,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { HeadingBlock as HeadingBlockType } from "@/lib/blog/blockSchema";

const ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  Brain,
  Calculator,
  CalendarClock,
  Clock,
  GitBranch,
  Layers,
  ListChecks,
  Scale,
  Shield,
  Target,
};

const SIZE_BY_LEVEL: Record<HeadingBlockType["level"], string> = {
  2: "text-lg sm:text-3xl md:text-[2rem]",
  3: "text-base sm:text-xl md:text-2xl",
  4: "text-base sm:text-lg",
};

const ICON_SIZE_BY_LEVEL: Record<HeadingBlockType["level"], string> = {
  2: "h-7 w-7 sm:h-9 sm:w-9",
  3: "h-6 w-6 sm:h-7 sm:w-7",
  4: "h-5 w-5",
};

type HeadingBlockProps = {
  block: HeadingBlockType;
  sectionLead?: boolean;
};

export function HeadingBlock({ block, sectionLead = false }: HeadingBlockProps) {
  const Tag = `h${block.level}` as "h2" | "h3" | "h4";
  const Icon = block.icon ? ICON_MAP[block.icon] : undefined;

  const marginByLevel =
    block.level === 2
      ? sectionLead
        ? "mt-0 mb-0"
        : "mt-10 sm:mt-12 mb-5 sm:mb-6"
      : block.level === 3
        ? "mt-5 sm:mt-8 mb-3 sm:mb-5"
        : "mt-4 mb-3";

  if (Icon && block.level === 2) {
    return (
      <Tag
        id={block.anchorId}
        className={`${SIZE_BY_LEVEL[block.level]} font-bold text-white scroll-mt-24 ${marginByLevel} grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4 items-center`}
      >
        <Icon
          className={`${ICON_SIZE_BY_LEVEL[block.level]} text-indigo-300`}
          aria-hidden
        />
        <span className="leading-snug sm:leading-tight">{block.text}</span>
      </Tag>
    );
  }

  return (
    <Tag
      id={block.anchorId}
      className={`${SIZE_BY_LEVEL[block.level]} font-bold text-white leading-snug sm:leading-tight scroll-mt-24 ${marginByLevel} ${
        Icon ? "flex items-center gap-3 sm:gap-4" : ""
      }`}
    >
      {Icon ? (
        <Icon
          className={`${ICON_SIZE_BY_LEVEL[block.level]} shrink-0 text-indigo-300`}
          aria-hidden
        />
      ) : null}
      <span className={Icon ? "min-w-0 flex-1" : undefined}>{block.text}</span>
    </Tag>
  );
}
