import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountEvents,getAccountProgress } from "@/lib/db/account-data";
import { defaultProgress } from "@/lib/progress";
import { AccountProvider } from "./account-provider";
import { getInsightContent } from "@/lib/insights/content";
import { BadgeCelebration } from "./dashboard/badge-celebration";
export async function AccountShell({children}:{children:ReactNode}) {
  let user:Awaited<ReturnType<typeof getCurrentUser>>=null,progress=defaultProgress(),events:Awaited<ReturnType<typeof getAccountEvents>>=[],unavailable=false;
  try {
    user=await getCurrentUser();
    if(user) [progress,events]=await Promise.all([getAccountProgress(user.id),getAccountEvents(user.id)]);
  } catch {user=null;progress=defaultProgress();events=[];unavailable=true;}
  const themeScript=user ? `try{var t=${JSON.stringify(user.theme)};if(t){document.documentElement.dataset.theme=t;localStorage.setItem('ovayi-theme',t)}else{delete document.documentElement.dataset.theme;localStorage.removeItem('ovayi-theme')}}catch{}` : "";
  const {badges,topics}=getInsightContent();
  return <><script dangerouslySetInnerHTML={{__html:themeScript}} /><AccountProvider initialUser={user} initialProgress={progress} initialEvents={events}>{unavailable&&<p className="hint" role="status">The account service is unavailable. You can keep learning as a guest and try your account again later.</p>}{children}<BadgeCelebration badges={badges} topics={topics}/></AccountProvider></>;
}
