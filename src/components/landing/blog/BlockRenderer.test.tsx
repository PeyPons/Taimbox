import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BlogBlock } from "@/lib/blog/blockSchema";
import { BlockRenderer } from "./BlockRenderer";

vi.mock("@/lib/supabase", () => ({ supabase: {} }));

const blocks: BlogBlock[] = [
  {
    id: "heading",
    type: "heading",
    level: 2,
    anchorId: "readable-section",
    text: "Readable section",
  },
  { id: "paragraph", type: "paragraph", html: "Focused editorial copy." },
  {
    id: "table",
    type: "table",
    headers: ["Signal", "Decision"],
    rows: [["Queue grows", "Reduce work in progress"]],
  },
];

describe("BlockRenderer editorial layout", () => {
  it("constrains headings and prose while keeping tables on the wider article rail", () => {
    const { container } = render(<BlockRenderer blocks={blocks} />);

    expect(screen.getByRole("heading", { level: 2, name: "Readable section" })).toHaveClass(
      "max-w-3xl",
      "mx-auto",
    );

    const prose = screen.getByText("Focused editorial copy.").parentElement;
    expect(prose).toHaveClass("max-w-3xl", "mx-auto");

    const tableWrapper = container.querySelector('[data-block-type="table"]');
    expect(tableWrapper).not.toHaveClass("max-w-3xl");
  });
});
