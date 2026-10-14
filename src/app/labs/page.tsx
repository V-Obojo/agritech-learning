import {listLabs} from "@/lib/content";
import {labLink} from "@/lib/content/lab-links";
import {LabGallery} from "@/components/labs/gallery";
export default function Page() {return <main id="main"><p className="eyebrow">Explore by doing</p><h1>Labs</h1><LabGallery items={listLabs().map(lab=>({lab,...labLink(lab)}))}/></main>;}
