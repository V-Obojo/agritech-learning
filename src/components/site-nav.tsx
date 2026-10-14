"use client";
import Link from "next/link";
import { useAccount,applyTheme } from "./account-provider";
import { UserMenu } from "./user-menu";
import { useRef,useState } from "react";

export function SiteNav({ name, parent }: { name: string; parent: string }) {
  const {user,setUser}=useAccount();
  const [themeError,setThemeError]=useState("");
  const menu = useRef<HTMLDialogElement>(null);
  const links = <><Link href="/">Learn</Link><Link href="/labs">Labs</Link><Link href="/dashboard">Dashboard</Link>{!user && <><Link href="/signin">Sign in</Link><Link className="button" href="/signup">Sign up</Link></>}</>;
  async function toggleTheme() {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = dark ? "light" : "dark";
    applyTheme(theme);
    if(user) {
      try {const response=await fetch("/api/me/theme",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({theme})});if(!response.ok) throw new Error();setUser({...user,theme});setThemeError("");}
      catch {setThemeError("Your theme changed here, but could not save to your account.");}
    }
  }
  return <header className="site-header"><div className="nav-inner">
    <div className="wordmark"><Link href="/" aria-label={name}><span className="brand-mark" aria-hidden="true">↗</span>{name}</Link><small>by {parent}</small></div>
    <nav className="desktop-nav" aria-label="Main navigation">{links}</nav>
    <UserMenu />
    {themeError && <span role="status">{themeError}</span>}
    <button className="theme-toggle secondary" onClick={toggleTheme} aria-label="Toggle colour theme"><span className="sun" aria-hidden="true">☀</span><span className="moon" aria-hidden="true">☾</span></button>
    <button className="menu-toggle secondary" aria-label="Open menu" aria-haspopup="dialog" onClick={() => menu.current?.showModal()}>☰</button>
    <dialog className="menu-sheet" ref={menu} aria-label="Navigation menu"><button className="secondary" onClick={() => menu.current?.close()} aria-label="Close menu">Close ×</button><nav aria-label="Mobile navigation" onClick={event => { if ((event.target as HTMLElement).closest("a")) menu.current?.close(); }}>{links}</nav></dialog>
  </div></header>;
}
