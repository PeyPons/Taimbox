import type { HeadingBlock as HeadingBlockType } from "@/lib/blog/blockSchema";

const SIZE_BY_LEVEL: Record<HeadingBlockType["level"], string> = {
  2: "text-xl sm:text-3xl md:text-4xl",
  3: "text-lg sm:text-2xl md:text-3xl",
  4: "text-base sm:text-xl",
};

export function HeadingBlock({ block }: { block: HeadingBlockType }) {
  const Tag = `h${block.level}` as "h2" | "h3" | "h4";
  return (
    <Tag
      id={block.anchorId}
      className={`${SIZE_BY_LEVEL[block.level]} font-bold text-white mb-5 sm:mb-6 mt-10 scroll-mt-24`}
    >
      {block.text}
    </Tag>
  );
}
