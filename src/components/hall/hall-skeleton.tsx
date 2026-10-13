/** Placeholder for the hall page while the route params resolve; mirrors the real layout. */
export function HallSkeleton() {
  return (
    <div className="lg:mx-auto lg:max-w-page lg:px-gutter lg:pt-6" aria-busy="true">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-10">
        <div>
          <div className="-mt-20 h-[26rem] animate-pulse bg-surface-2 lg:mt-0 lg:h-[34rem] lg:rounded-card" />
          <div className="relative -mt-6 rounded-t-card bg-page px-gutter pt-7 lg:mt-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:pt-8">
            <div className="h-9 w-48 animate-pulse rounded-pill bg-surface-2" />
            <div className="mt-4 h-5 w-32 animate-pulse rounded-pill bg-surface-2" />
          </div>
        </div>
        <div className="px-gutter pt-8 lg:px-0 lg:pt-0">
          <div className="h-72 animate-pulse rounded-card bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
