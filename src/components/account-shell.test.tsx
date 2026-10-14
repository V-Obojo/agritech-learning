import {it,expect,vi} from "vitest";
import {renderToString} from "react-dom/server";
vi.mock("server-only",()=>({}));
vi.mock("@/lib/auth/session",()=>({getCurrentUser:vi.fn()}));
vi.mock("@/lib/db/account-data",()=>({getAccountProgress:vi.fn(),getAccountEvents:vi.fn()}));
vi.mock("@/lib/insights/content",()=>({getInsightContent:()=>({badges:{badges:[]},topics:[]})}));
vi.mock("./dashboard/badge-celebration",()=>({BadgeCelebration:()=>null}));
import {getCurrentUser} from "@/lib/auth/session";
import {getAccountProgress,getAccountEvents} from "@/lib/db/account-data";
import {AccountShell} from "./account-shell";
it("session database failure preserves guest learning without exposing provider diagnostics",async()=>{
  vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("private database connection diagnostic"));
  const html=renderToString(await AccountShell({children:<article>Guest lesson</article>}));
  expect(html).toContain("Guest lesson");expect(html).toContain("keep learning as a guest");expect(html).not.toContain("private database");
});
it("progress database failure also falls back to the guest shell",async()=>{
  vi.mocked(getCurrentUser).mockResolvedValueOnce({id:"test-user",name:"Learner",email:"learner@example.test",state:null,intention:null,theme:null});
  vi.mocked(getAccountProgress).mockRejectedValueOnce(new Error("database offline"));vi.mocked(getAccountEvents).mockResolvedValueOnce([]);
  const html=renderToString(await AccountShell({children:<article>Guest lesson</article>}));
  expect(html).toContain("Guest lesson");expect(html).toContain("account service is unavailable");expect(html).not.toContain("database offline");
});
