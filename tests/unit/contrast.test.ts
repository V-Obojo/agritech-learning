import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const css=readFileSync("src/app/globals.css","utf8");
const blocks=[...css.matchAll(/:root(?:\[data-theme=dark\])?\s*\{([^}]+)\}/g)];
function tokens(block:string) {return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(m=>[m[1],m[2]]));}
const light=tokens(blocks[0][1]),dark={...light,...tokens(blocks[1][1])};
function luminance(hex:string) {return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
export function contrast(a:string,b:string) {const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (values[0]+.05)/(values[1]+.05);}
const pairs=[...['background','surface','green-soft','callout'].flatMap(bg=>['foreground','muted','green','soil','amber'].map(fg=>[fg,bg])),['button-text','green']];
describe.each([['light',light],['dark',dark]] as const)('%s text contrast',(_theme,palette)=>{
  it.each(pairs)('%s on %s is at least 4.5:1',(fg,bg)=>expect(contrast(palette[fg],palette[bg])).toBeGreaterThanOrEqual(4.5));
});
