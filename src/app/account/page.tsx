import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { getCatalog } from "@/lib/content";
import { AccountForm } from "@/components/account-form";
export default function Page() {return <Suspense fallback={<main id="main"><p>Loading account…</p></main>}><Account /></Suspense>;}
async function Account() {const user=await requireUser("/account");return <main id="main" style={{maxWidth:760}}><AccountForm profile={user} intentions={getCatalog().intentions} /></main>;}
