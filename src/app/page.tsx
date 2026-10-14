import { getPathway } from "@/lib/content";
import { WelcomeFlow } from "@/components/welcome-flow";
export default function Home() {
  return <WelcomeFlow pathway={getPathway()} />;
}
