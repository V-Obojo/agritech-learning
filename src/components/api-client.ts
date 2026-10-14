import type { z } from "zod";
export async function postJson<T>(url: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? "Please try again.");
  return schema.parse(value);
}
