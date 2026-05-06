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
  return (
    <>
      {blocks.map((block) => (
        <div key={block.id} data-block-type={block.type}>
          {renderBlock(block, blocks)}
        </div>
      ))}
    </>
  );
}
