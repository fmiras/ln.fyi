import { INTERVALS, INTERVALS_LABELS, type Interval } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function IntervalToggle({ currentInterval = '3m' }: { currentInterval?: Interval }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {INTERVALS.includes(currentInterval)
            ? INTERVALS_LABELS[currentInterval]
            : INTERVALS_LABELS['3m']}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[50px]">
        {INTERVALS.map((interval) => (
          <form action="" key={interval}>
            <input type="hidden" name="interval" value={interval} />
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full text-left">
                {INTERVALS_LABELS[interval]}
              </button>
            </DropdownMenuItem>
          </form>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
