import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  const cardClasses = [
    "lg:col-span-8",
    "lg:col-span-4",
    "lg:col-span-4",
    "lg:col-span-4",
    "lg:col-span-4",
    "lg:col-span-7",
    "lg:col-span-5",
  ];

  return (
    <main className="min-h-screen bg-background">
      <section className="relative flex min-h-[88svh] items-end overflow-hidden bg-[linear-gradient(135deg,#172554,#0f766e,#111827)] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-5">
          <Skeleton className="h-6 w-44 bg-white/15" />
          <Skeleton className="h-24 w-full max-w-3xl bg-white/15" />
          <Skeleton className="h-6 w-full max-w-xl bg-white/12" />
          <Skeleton className="h-16 w-full max-w-2xl rounded-full bg-white/15" />
        </div>
      </section>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8">
        {cardClasses.map((className, index) => (
          <Skeleton key={`${className}-${index}`} className={`h-72 rounded-2xl ${className}`} />
        ))}
      </div>
    </main>
  );
}
