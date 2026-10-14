"use client";
import Link from "next/link";
import { useState,type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { signinSchema,signupSchema,safeCallback } from "@/lib/auth/validation";
import { getEvents } from "@/lib/metrics";
import { useProgress } from "./use-progress";
import { mergeGuestAccount } from "./account-actions";

export function AuthForm({signup,callbackUrl,supportContact}:{signup:boolean;callbackUrl:string;supportContact:string}) {
  const {progress}=useProgress();
  const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState("");
  const [show,setShow]=useState(false),[busy,setBusy]=useState(false),[forgot,setForgot]=useState(false);
  const [error,setError]=useState(""),[fields,setFields]=useState<Record<string,string>>({});
  async function submit(event:FormEvent) {
    event.preventDefault();setError("");setFields({});
    const parsed=signup ? signupSchema.safeParse({name,email,password,intention:progress.intention}) : signinSchema.safeParse({email,password});
    if(!parsed.success) {setFields(Object.fromEntries(parsed.error.issues.map(issue=>[String(issue.path[0]),issue.message])));return;}
    setBusy(true);
    try {
      const guest=progress,events=getEvents();
      if(signup) {
        const response=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(parsed.data)});
        if(!response.ok) {setError((await response.json()).error ?? "Account creation could not finish. Please try again.");return;}
      }
      const result=await signIn("credentials",{email,password,redirect:false,callbackUrl:safeCallback(callbackUrl)});
      if(!result?.ok || result.error) {setError(result?.error==="CredentialsSignin" ? "Email or password is incorrect" : "The account service is unavailable. Your guest progress is still here; please try again.");return;}
      await mergeGuestAccount(guest,events);
      window.location.assign(safeCallback(callbackUrl));
    } catch {setError("Your account could not finish syncing. Your guest progress is still here; please try again.");}
    finally {setBusy(false);}
  }
  const destination=safeCallback(callbackUrl);
  return <section className="card" style={{maxWidth:520,margin:"2rem auto"}}><h1>{signup ? "Sign up" : "Sign in"}</h1><p>{signup ? "Create an optional account to keep your learning progress." : "Welcome back. Continue at your own pace."}</p>
    <form onSubmit={submit} noValidate>
      {signup && <><label htmlFor="auth-name">Name</label><input id="auth-name" autoComplete="name" maxLength={60} value={name} disabled={busy} onChange={event=>setName(event.target.value)} aria-describedby={fields.name ? "name-error" : undefined} />{fields.name && <p id="name-error" role="alert">{fields.name}</p>}</>}
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" value={email} disabled={busy} onChange={event=>setEmail(event.target.value)} aria-describedby={fields.email ? "email-error" : undefined} />{fields.email && <p id="email-error" role="alert">{fields.email}</p>}
      <label htmlFor="auth-password">Password</label><input id="auth-password" type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={password} disabled={busy} onChange={event=>setPassword(event.target.value)} aria-describedby={fields.password ? "password-error" : undefined} />
      {fields.password && <p id="password-error" role="alert">{fields.password}</p>}<button type="button" className="secondary" aria-pressed={show} onClick={()=>setShow(!show)}>{show ? "Hide password" : "Show password"}</button>
      {signup && <p className="eyebrow">Use at least 8 characters, including a letter and a number.</p>}
      <div className="actions"><button disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button></div>
      {error && <p role="alert">{error}</p>}
    </form>
    {!signup && <><button className="text-button" aria-expanded={forgot} onClick={()=>setForgot(!forgot)}>Forgot password?</button>{forgot && <p>Contact the admin to reset your password: <a href={`mailto:${supportContact}`}>{supportContact}</a></p>}</>}
    <p><Link href={`${signup ? "/signin" : "/signup"}?callbackUrl=${encodeURIComponent(destination)}`}>{signup ? "Already have an account? Sign in" : "New here? Sign up"}</Link></p><Link href="/">Keep learning as a guest</Link>
  </section>;
}
