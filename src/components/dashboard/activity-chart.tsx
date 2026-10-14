"use client";
import { Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis } from "recharts";
export default function ActivityChart({series}:{series:{day:string;count:number}[]}) {
  return <div data-chart="learning-activity" style={{height:220,width:"100%",minWidth:0}} role="img" aria-label={`Learning activity: ${series.reduce((n,d)=>n+d.count,0)} events in the last ${series.length} days`}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={series} margin={{left:-24,right:8,top:12,bottom:4}}><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="day" tickFormatter={d=>d.slice(5)} tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fill:"var(--muted)",fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"var(--surface)",borderColor:"var(--border)",borderRadius:12,color:"var(--foreground)"}}/><Bar dataKey="count" name="Learning events" fill="var(--green)" radius={[5,5,0,0]} isAnimationActive={false}/></BarChart></ResponsiveContainer>
  </div>;
}
