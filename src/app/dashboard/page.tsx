import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/insights/data";
import { getInsightContent } from "@/lib/insights/content";
import { Dashboard } from "@/components/dashboard/dashboard";
import { dashboardStyles as styles } from "@/components/dashboard/styles";
export default function Page() {return <Suspense fallback={<main id="main" aria-busy="true"><h1>Dashboard</h1><div className={styles.loading}>{[0,1,2,3].map(i=><div key={i} className={styles.skeleton}/>)}</div></main>}><DashboardPage/></Suspense>;}
async function DashboardPage() {
  const user=await requireUser("/dashboard"),now=new Date();
  const data=await getDashboardData(user.id,now);
  return <Dashboard {...data} {...getInsightContent()} user={user} now={now.toISOString()}/>;
}
