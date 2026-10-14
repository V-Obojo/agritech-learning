import { z } from "zod";
import { authenticated,readBody } from "@/lib/auth/http";
import { getDashboardLayout,saveDashboardLayout } from "@/lib/insights/data";
import { layoutSchema } from "@/lib/insights/layout";
export function GET(request:Request) {return authenticated(request,async id=>Response.json({widgets:await getDashboardLayout(id)}));}
export function PUT(request:Request) {return authenticated(request,async id=>{const {widgets}=await readBody(request,z.strictObject({widgets:layoutSchema}));await saveDashboardLayout(id,widgets);return Response.json({widgets});});}
