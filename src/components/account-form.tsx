"use client";
import { useState,type FormEvent } from "react";
import type { Catalog } from "@/lib/content/schemas";
import type { AccountProfile } from "@/lib/auth/account-types";
import { changePasswordSchema,nigerianStates,profileSchema } from "@/lib/auth/validation";
import { flushAccountProgress,hydrateAccountProgress } from "@/lib/progress";
import { applyTheme,useAccount } from "./account-provider";
import { leaveAccount } from "./account-actions";

export function AccountForm({profile,intentions}:{profile:AccountProfile;intentions:Catalog["intentions"]}) {
  const {setUser}=useAccount();
  const [name,setName]=useState(profile.name),[state,setState]=useState(profile.state ?? ""),[intention,setIntention]=useState(profile.intention ?? ""),[theme,setTheme]=useState(profile.theme ?? "system");
  const [currentPassword,setCurrent]=useState(""),[newPassword,setNew]=useState(""),[confirmation,setConfirmation]=useState("");
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  async function action(work:()=>Promise<void>) {setBusy(true);setError("");setMessage("");try {await work();} catch {setError("Your change could not be saved. Check your details and try again.");} finally {setBusy(false);}}
  async function request(url:string,method:string,body:unknown) {
    const response=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(!response.ok) {const result=await response.json();setError(result.error ?? "Please try again.");return false;}return true;
  }
  function saveProfile(event:FormEvent) {
    event.preventDefault();const parsed=profileSchema.safeParse({name,state:state || null,intention:intention || null,theme:theme==="system" ? null : theme});
    if(!parsed.success) {setError(parsed.error.issues[0].message);return;}
    void action(async()=>{await flushAccountProgress();if(await request("/api/me/profile","PUT",parsed.data)) {
      setUser({...profile,...parsed.data,state:parsed.data.state ?? null,intention:parsed.data.intention ?? null});applyTheme(parsed.data.theme);await hydrateAccountProgress();setMessage("Profile saved.");
    }});
  }
  function savePassword(event:FormEvent) {
    event.preventDefault();const parsed=changePasswordSchema.safeParse({currentPassword,newPassword});
    if(!parsed.success) {setError(parsed.error.issues[0].message);return;}
    void action(async()=>{if(await request("/api/me/password","PUT",parsed.data)) {setCurrent("");setNew("");setMessage("Password changed.");}});
  }
  return <><h1>Your account</h1><p>{profile.email}</p><div role="status" aria-live="polite">{message}</div>{error && <p role="alert">{error}</p>}
    <section className="card"><h2>Profile and preferences</h2><form onSubmit={saveProfile}>
      <label htmlFor="profile-name">Name</label><input id="profile-name" autoComplete="name" maxLength={60} value={name} disabled={busy} onChange={event=>setName(event.target.value)} />
      <label className="choice">State<select aria-label="State" value={state} disabled={busy} onChange={event=>setState(event.target.value)} style={{maxWidth:"100%",minHeight:44}}><option value="">Prefer not to say</option>{nigerianStates.map(item=><option key={item}>{item}</option>)}</select></label>
      <label className="choice" style={{flexWrap:"wrap"}}>Learning intention<select aria-label="Learning intention" value={intention} disabled={busy} onChange={event=>setIntention(event.target.value)} style={{maxWidth:"100%",minHeight:44}}><option value="">Not chosen yet</option>{intentions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label className="choice">Theme<select aria-label="Theme" value={theme} disabled={busy} onChange={event=>setTheme(event.target.value)} style={{minHeight:44}}><option value="system">Follow system</option><option value="light">Light</option><option value="dark">Dark</option></select></label><button disabled={busy}>Save profile</button>
    </form></section>
    <section className="card"><h2>Change password</h2><form onSubmit={savePassword}><label htmlFor="current-password">Current password</label><input id="current-password" type="password" autoComplete="current-password" value={currentPassword} disabled={busy} onChange={event=>setCurrent(event.target.value)} />
      <label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" value={newPassword} disabled={busy} onChange={event=>setNew(event.target.value)} /><p>Use at least 8 characters, including a letter and a number.</p><button disabled={busy}>Change password</button></form></section>
    <section className="card"><h2>Delete account</h2><p>This removes your profile, saved progress and learning history. Type DELETE to confirm.</p><form onSubmit={event=>{event.preventDefault();void action(async()=>{if(await request("/api/me/account","DELETE",{confirmation})) await leaveAccount(true);});}}><label htmlFor="delete-confirmation">Confirm account deletion</label><input id="delete-confirmation" value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)} /><button disabled={busy || confirmation!=="DELETE"}>Delete my account</button></form></section>
    <button className="secondary" disabled={busy} onClick={()=>{void action(()=>leaveAccount());}}>Sign out</button>
  </>;
}
