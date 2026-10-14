import Link from "next/link";
export function Breadcrumb({ items }: { items: { label: string; href: string }[] }) {
  return <nav aria-label="Breadcrumb"><ol className="breadcrumbs">{items.map((item,index) => <li key={item.href}>{index>0 && <span aria-hidden="true">› </span>}{index===items.length-1 ? <span aria-current="page">{item.label}</span> : <Link href={item.href}>{item.label}</Link>}</li>)}</ol></nav>;
}
