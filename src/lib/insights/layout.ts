import { z } from "zod";
export const widgetIds=["continue","streak","progress","badges","activity-chart","time","answers","guide-history","labs","checks","profile"] as const;
export type WidgetId=typeof widgetIds[number];
export const widgetLabels:Record<WidgetId,string>={continue:"Continue learning",progress:"Your progress",streak:"Learning streak",badges:"Badges","activity-chart":"Learning activity",answers:"Your answers","guide-history":"Guide history",labs:"Your labs",checks:"Understanding checks",time:"Learning time",profile:"Your profile"};
export const layoutSchema=z.array(z.strictObject({id:z.enum(widgetIds),visible:z.boolean()})).length(widgetIds.length).refine(items=>new Set(items.map(w=>w.id)).size===widgetIds.length,"Include every widget exactly once");
export type WidgetLayout=z.infer<typeof layoutSchema>;
export function defaultLayout():WidgetLayout {return widgetIds.map(id=>({id,visible:true}));}
