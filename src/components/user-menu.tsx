"use client";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "./account-provider";
import { leaveAccount } from "./account-actions";
export function UserMenu() {
  const {user}=useAccount();const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  if(!user) return null;
  const initials=user.name.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join("").toUpperCase();
  return <details style={{position:"relative"}}><summary role="button" aria-label="Account menu" style={{display:"flex",alignItems:"center",justifyContent:"center",minWidth:44,minHeight:44,border:"1px solid var(--border)",borderRadius:"50%",padding:".5rem",listStyle:"none"}}>{initials}</summary>
    <nav aria-label="Account navigation" style={{position:"absolute",right:0,top:"100%",background:"var(--surface)",padding:"1rem",border:"1px solid var(--border)",borderRadius:"var(--radius)",boxShadow:"var(--shadow)",minWidth:210,display:"grid",gap:".5rem"}}><strong>{user.name}</strong><Link href="/dashboard" style={{minHeight:44,display:"flex",alignItems:"center"}}>Dashboard</Link><Link href="/account" style={{minHeight:44,display:"flex",alignItems:"center"}}>Account</Link><button disabled={busy} onClick={async()=>{setBusy(true);try {await leaveAccount();} catch {setError("Your changes could not sync. Please retry before signing out.");setBusy(false);}}}>Sign out</button>{error && <p role="alert">{error}</p>}</nav>
  </details>;
}
