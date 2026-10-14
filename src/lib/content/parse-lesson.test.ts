import { describe, expect, it } from "vitest";
import { parseLesson } from "./parse-lesson";

const header = `---
id: example
title: Example: a lesson
species: Example species
region: Example region
status: draft-unreviewed
review_note: Example note
estimated_minutes: 2
---`;
const body = "First paragraph.\n\nSecond paragraph.\n- First bullet\n- Second bullet";
const markdown = `${header}\n\n## example-01: First chunk\nsources: source-a, source-b\n\n${body}\n\n## example-02: Second chunk\nsources: source-a\n\nLast paragraph.\n`;

describe("parseLesson", () => {
  it("preserves multi-paragraph bodies and bullet lists and splits chunks", () => {
    const lesson = parseLesson(markdown);
    expect(lesson.title).toBe("Example: a lesson");
    expect(lesson.estimated_minutes).toBe(2);
    expect(lesson.chunks).toEqual([
      { id: "example-01", title: "First chunk", sourceIds: ["source-a", "source-b"], body },
      { id: "example-02", title: "Second chunk", sourceIds: ["source-a"], body: "Last paragraph." },
    ]);
  });
  it("handles Windows line endings", () => {
    expect(parseLesson(markdown.replace(/\n/g, "\r\n"))).toEqual(parseLesson(markdown));
  });
  it("rejects a chunk without a sources line", () => {
    expect(() => parseLesson(markdown.replace("sources: source-a, source-b\n", "")))
      .toThrow("example-01: missing sources: line");
  });
  it.each([
    ["empty sources", markdown.replace("sources: source-a, source-b", "sources:")],
    ["empty body", `${header}\n## example-01: First chunk\nsources: source-a\n`],
    ["invalid minutes", markdown.replace("estimated_minutes: 2", "estimated_minutes: nope")],
    ["missing metadata", markdown.replace("region: Example region\n", "")],
    ["missing opening delimiter", markdown.slice(4)],
    ["missing closing delimiter", markdown.replace("\n---\n", "\n")],
    ["malformed heading", markdown.replace("## example-01: First chunk", "## Bad heading")],
  ])("rejects %s", (_label, input) => {
    expect(() => parseLesson(input)).toThrow("Invalid lesson");
  });
});
