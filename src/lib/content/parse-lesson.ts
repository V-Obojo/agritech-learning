import { lessonSchema, type Lesson } from "./schemas";

/** Parse the simple frontmatter and chunk format in content/README.md. */
export function parseLesson(markdown: string): Lesson {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new Error("Invalid lesson: expected opening frontmatter ---");
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end === -1) throw new Error("Invalid lesson: missing closing frontmatter ---");
  const frontmatter: Record<string, unknown> = {};
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    const match = /^([^:]+):\s*(.*)$/.exec(line);
    if (!match) throw new Error(`Invalid lesson frontmatter: ${line}`);
    const key = match[1].trim();
    frontmatter[key] = key === "estimated_minutes" ? Number(match[2]) : match[2].trim();
  }

  const chunks: unknown[] = [];
  let index = end + 1;
  while (index < lines.length) {
    if (!lines[index].trim()) { index++; continue; }
    const heading = /^##\s+([^:]+):\s*(.+)$/.exec(lines[index]);
    if (!heading) throw new Error(`Invalid lesson chunk heading: ${lines[index]}`);
    const id = heading[1].trim();
    index++;
    while (index < lines.length && !lines[index].trim()) index++;
    const sources = /^sources:\s*(.*)$/.exec(lines[index] ?? "");
    if (!sources) throw new Error(`Invalid lesson chunk ${id}: missing sources: line`);
    index++;
    const bodyStart = index;
    while (index < lines.length && !/^##\s/.test(lines[index])) index++;
    chunks.push({
      id, title: heading[2].trim(),
      sourceIds: sources[1].split(",").map((source) => source.trim()),
      body: lines.slice(bodyStart, index).join("\n").trim(),
    });
  }
  const result = lessonSchema.safeParse({ ...frontmatter, chunks });
  if (!result.success) throw new Error(`Invalid lesson: ${result.error.message}`);
  return result.data;
}
