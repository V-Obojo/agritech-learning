import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { safeCallback } from "@/lib/auth/validation";
import { AuthForm } from "@/components/auth-form";
import catalog from "../../../content/catalog.json";
export default function Page(props:{searchParams:Promise<{callbackUrl?:string}>}) {return <Suspense fallback={<main id="main"><p>Loading account…</p></main>}><AccountPage {...props} /></Suspense>;}
async function AccountPage({searchParams}:{searchParams:Promise<{callbackUrl?:string}>}) {
 const callbackUrl=safeCallback((await searchParams).callbackUrl);
 if(await getCurrentUser()) redirect(callbackUrl);
 return <main id="main"><AuthForm signup={false} callbackUrl={callbackUrl} supportContact={catalog.product.supportContact} /></main>;
}
