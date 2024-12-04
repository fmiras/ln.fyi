import { INTERVALS } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function IntervalToggle({ currentInterval = '1w' }: { currentInterval?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {INTERVALS.includes(currentInterval) ? currentInterval : '1w'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[50px]">
        {INTERVALS.map((interval) => (
          <form action="" key={interval}>
            <input type="hidden" name="interval" value={interval} />
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full text-left">
                {interval}
              </button>
            </DropdownMenuItem>
          </form>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
