import { it,expect } from "vitest";
import { renderToString } from "react-dom/server";
import { AccountProvider } from "./account-provider";
import { useProgress } from "./use-progress";
import { defaultProgress } from "@/lib/progress";
it("renders signed-in server progress on the first render without an empty progress flash",()=>{
  function Probe() {const {progress,ready}=useProgress();return <output>{`${progress.intention}:${ready}`}</output>;}
  const html=renderToString(<AccountProvider initialUser={{id:"test-user",name:"Learner",email:"learner@example.test",state:null,intention:"student",theme:null}} initialProgress={{...defaultProgress(),intention:"student"}} initialEvents={[]}><Probe /></AccountProvider>);
  expect(html).toContain("<output>student:true</output>");
});
