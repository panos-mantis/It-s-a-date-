import { useNavigate } from 'react-router';
import { Tabs, tabDomId } from '../../components/ui';
import { useAdminIdeas } from './api';
import { AllIdeasTab } from './AllIdeasTab';
import { PendingTab } from './PendingTab';

/** Admin (HANDOFF §1 "Admin"): Pending and All ideas. Task 11 adds Tags and Users to the tabs. */
export function AdminPage() {
  const navigate = useNavigate();
  // The same query as the Pending tab, so the count is the queue's own total.
  const pending = useAdminIdeas('pending');
  const count = pending.data?.pages[0]?.total;

  const seeAll = () => {
    // The Pending panel (and the focused button) is about to go; land on the tab, which is always
    // rendered.
    document.getElementById(tabDomId('all'))?.focus();
    void navigate({ hash: 'all' }, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      <title>{"Admin · It's a Date"}</title>
      <section
        aria-labelledby="admin-title"
        className="flex flex-col gap-1.5 pb-4 pt-6 sm:pb-6 sm:pt-10"
      >
        <h1
          id="admin-title"
          className="text-[30px] font-medium leading-[1.08] tracking-display text-fg sm:text-[38px]"
        >
          Admin
        </h1>
        <p className="max-w-[60ch] text-[15px] text-muted sm:text-base">
          Review new ideas, tidy up older ones, and look after tags and people.
        </p>
      </section>
      <Tabs
        label="Admin sections"
        tabs={[
          {
            id: 'pending',
            label: (
              <>
                Pending{' '}
                {count !== undefined && (
                  <span className="inline-grid h-[22px] min-w-6 place-items-center rounded-pill bg-surface-sunk px-[7px] text-xs font-semibold tabular-nums text-fg">
                    {count}
                  </span>
                )}
              </>
            ),
            panel: <PendingTab onSeeAll={seeAll} />,
          },
          { id: 'all', label: 'All ideas', panel: <AllIdeasTab /> },
        ]}
      />
    </>
  );
}
