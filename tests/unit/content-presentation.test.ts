import { describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import authoredCatalog from "../../content/catalog.json";
import authoredPath from "../../content/fish-farming/path.json";
import { getCatalog, getSubjectPath } from "../../src/lib/content";
import { catalogSchema, subjectPathSchema } from "../../src/lib/content/schemas";

describe("presentation copy from content",()=>{
  it("retains authored home and hub copy through the validating loaders",()=>{
    expect(getCatalog().product.heroEyebrow).toBe(authoredCatalog.product.heroEyebrow);
    expect(getSubjectPath(authoredPath.subject).hubCard).toEqual(authoredPath.hubCard);
  });
  it("rejects missing or empty authored presentation copy",()=>{
    const {heroEyebrow,...product}=authoredCatalog.product;
    expect(heroEyebrow).not.toBe("");
    expect(catalogSchema.safeParse({...authoredCatalog,product}).success).toBe(false);
    expect(catalogSchema.safeParse({...authoredCatalog,product:{...product,heroEyebrow:" "}}).success).toBe(false);
    for(const key of ["title","note","intentionPrompt"] as const) {
      expect(subjectPathSchema.safeParse({...authoredPath,hubCard:{...authoredPath.hubCard,[key]:undefined}}).success).toBe(false);
      expect(subjectPathSchema.safeParse({...authoredPath,hubCard:{...authoredPath.hubCard,[key]:" "}}).success).toBe(false);
    }
  });
});
