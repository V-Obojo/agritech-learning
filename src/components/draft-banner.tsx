export function DraftBanner({ note }: { note: string }) {
  return <aside className="draft-banner"><strong>Draft learning material</strong><p>{note}</p></aside>;
}
