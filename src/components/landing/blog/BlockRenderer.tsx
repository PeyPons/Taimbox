import type { BlogBlock } from "@/lib/blog/blockSchema";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { ListBlock } from "./blocks/ListBlock";
import { TableBlock } from "./blocks/TableBlock";
import { FaqBlock } from "./blocks/FaqBlock";
import { TocBlock } from "./blocks/TocBlock";
import { RelatedPostBlock } from "./blocks/RelatedPostBlock";
import { HtmlBlock } from "./blocks/HtmlBlock";
import { CtaBlock } from "./blocks/CtaBlock";
import { VisualRefBlock } from "./blocks/VisualRefBlock";

interface BlockRendererProps {
  blocks: BlogBlock[];
}

function isH2(block: BlogBlock): block is Extract<BlogBlock, { type: "heading" }> {
  return block.type === "heading" && block.level === 2;
}

function splitIntoSections(blocks: BlogBlock[]) {
  const intro: BlogBlock[] = [];
  const sections: { heading: Extract<BlogBlock, { type: "heading" }>; blocks: BlogBlock[] }[] = [];

  let i = 0;
  while (i < blocks.length && !isH2(blocks[i])) {
    intro.push(blocks[i]);
    i++;
  }

  while (i < blocks.length) {
    if (!isH2(blocks[i])) {
      intro.push(blocks[i]);
      i++;
      continue;
    }
    const heading = blocks[i] as Extract<BlogBlock, { type: "heading" }>;
    const sectionBlocks: BlogBlock[] = [];
    i++;
    while (i < blocks.length && !isH2(blocks[i])) {
      sectionBlocks.push(blocks[i]);
      i++;
    }
    sections.push({ heading, blocks: sectionBlocks });
  }

  return { intro, sections };
}

function renderBlock(block: BlogBlock, allBlocks: BlogBlock[]) {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock block={block} />;
    case "heading":
      return <HeadingBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
    case "faq":
      return <FaqBlock block={block} />;
    case "toc":
      return <TocBlock allBlocks={allBlocks} />;
    case "relatedPost":
      return <RelatedPostBlock block={block} />;
    case "html":
      return <HtmlBlock block={block} />;
    case "cta":
      return <CtaBlock block={block} />;
    case "visualRef":
      return <VisualRefBlock block={block} />;
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const { intro, sections } = splitIntoSections(blocks);

  return (
    <>
      {intro.length > 0 && (
        <div className="flex flex-col gap-6 sm:gap-7 mb-10 sm:mb-14">
          {intro.map((block) => (
            <div key={block.id} data-block-type={block.type}>
              {renderBlock(block, blocks)}
            </div>
          ))}
        </div>
      )}

      {sections.map(({ heading, blocks: sectionBlocks }) => (
        <section
          key={heading.id}
          aria-labelledby={heading.anchorId}
          className="flex flex-col gap-5 sm:gap-7 mb-12 sm:mb-16 pt-8 sm:pt-12 border-t border-white/10 scroll-mt-24"
        >
          <HeadingBlock block={{ ...heading, level: 2 }} sectionLead />
          {sectionBlocks.map((block) => (
            <div
              key={block.id}
              data-block-type={block.type}
              className={
                block.type === "visualRef"
                  ? "py-1 sm:py-2"
                  : block.type === "heading" && block.level === 3
                    ? "mt-2 sm:mt-3"
                    : undefined
              }
            >
              {renderBlock(block, blocks)}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
