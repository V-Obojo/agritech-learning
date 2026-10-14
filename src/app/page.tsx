import { getCatalog } from "@/lib/content";
import { WelcomeFlow } from "@/components/welcome-flow";
import { areaPath } from "./navigation-data";
export default function Home() {
  const catalog=getCatalog();
  return <WelcomeFlow catalog={catalog} areas={catalog.areas.map(area=>({id:area.id,href:areaPath(area.slug)}))} />;
}
