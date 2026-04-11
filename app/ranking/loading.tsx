import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="flex flex-col gap-10 pb-12">
      <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-10 sm:h-16 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[720px] rounded-xl" />
          <Skeleton className="h-[720px] rounded-xl" />
        </div>
      </section>
    </main>
  )
}
