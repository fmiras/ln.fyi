import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="flex flex-col gap-8 pb-12">
      <section className="container mx-auto px-4 sm:px-6 pt-8">
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-8 w-60 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </section>
    </main>
  )
}
