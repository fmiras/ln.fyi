import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="flex flex-col gap-12 pb-12">
      <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 max-w-3xl">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-12 sm:h-20 w-full" />
          <Skeleton className="h-12 sm:h-20 w-3/4" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 flex flex-col gap-5">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 flex flex-col gap-5">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 flex flex-col gap-5">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[520px] rounded-xl" />
          <Skeleton className="h-[520px] rounded-xl" />
        </div>
      </section>
    </main>
  )
}
