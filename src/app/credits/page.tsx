import {getSources,listMedia} from "@/lib/content";
import {Figure} from "@/components/media/figure";
import "@/components/labs/labs.css";
export default function Page() {return <main id="main"><h1>Credits</h1><h2>Media</h2><div className="credits-grid">{listMedia().map(media=><Figure key={media.id} media={media}/>)}</div><section><h2>Sources</h2><ul>{getSources().sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.publisher} · {source.year} · Accessed {source.accessed}</p></li>)}</ul></section></main>;}
