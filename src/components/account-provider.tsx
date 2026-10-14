"use client";
import { createContext,useContext,useEffect,useState,useSyncExternalStore,type ReactNode } from "react";
import type { AccountProfile } from "@/lib/auth/account-types";
import { configureProgressAccount,defaultProgress,flushAccountProgress,getProgressSyncError,hydrateAccountProgress,subscribeProgress,type Progress } from "@/lib/progress";
import { configureMetricsAccount,flushAccountEvents,type MetricEvent } from "@/lib/metrics";

const AccountContext=createContext<{user:AccountProfile|null;initialProgress:Progress;setUser:(user:AccountProfile)=>void}>({user:null,initialProgress:defaultProgress(),setUser:()=>{}});
export function useAccount() {return useContext(AccountContext);}
export function applyTheme(theme:"light"|"dark"|null) {
  if(theme) document.documentElement.dataset.theme=theme;else delete document.documentElement.dataset.theme;
  try {if(theme) localStorage.setItem("ovayi-theme",theme);else localStorage.removeItem("ovayi-theme");} catch {}
}
export function AccountProvider({initialUser,initialProgress,initialEvents,children}:{initialUser:AccountProfile|null;initialProgress:Progress;initialEvents:MetricEvent[];children:ReactNode}) {
  const [user,setUser]=useState(()=>{
    if(typeof window!=="undefined") {configureProgressAccount(initialUser?.id ?? null,initialProgress);configureMetricsAccount(initialUser?.id ?? null,initialEvents);}
    return initialUser;
  });
  const error=useSyncExternalStore(subscribeProgress,getProgressSyncError,()=>null);
  useEffect(()=>{if(initialUser) {applyTheme(initialUser.theme);void hydrateAccountProgress();}},[initialUser]); // Server data supplies the first render; refresh never blanks it.
  useEffect(()=>{
    if(!initialUser) return;
    const flush=()=>{void flushAccountProgress().catch(()=>{});void flushAccountEvents().catch(()=>{});};
    window.addEventListener("pagehide",flush);return ()=>window.removeEventListener("pagehide",flush);
  },[initialUser]);
  return <AccountContext.Provider value={{user,setUser,initialProgress}}>
    {error && <div className="hint" role="status">{error} <button onClick={()=>{void flushAccountProgress().catch(()=>{});}}>Retry save</button></div>}{children}
  </AccountContext.Provider>;
}
