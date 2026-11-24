import { EmptyState } from '../../components/ui';

export function HomePage() {
  return (
    <section className="py-12">
      <title>{"It's a Date"}</title>
      <h1 className="font-display text-3xl text-fg sm:text-4xl">
        Plans worth <em className="font-display italic">saying yes</em> to.
      </h1>
      <EmptyState title="Date ideas are on their way." />
    </section>
  );
}
