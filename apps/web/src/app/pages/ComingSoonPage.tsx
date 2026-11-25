export function ComingSoonPage({ title }: { title: string }) {
  return (
    <section className="py-12">
      <title>{`${title} · It's a Date`}</title>
      <h1 className="font-display text-3xl text-fg">{title}</h1>
      <p className="mt-3 text-base text-muted">This page is coming soon.</p>
    </section>
  );
}
