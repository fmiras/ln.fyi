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
      <DropdownMenuContent align="end" className="min-w-2">
        {INTERVALS.map((interval) => (
          <DropdownMenuItem asChild key={interval}>
            <form key={interval}>
              <button
                type="submit"
                name="interval"
                value={interval}
                className="w-full flex items-center cursor-pointer"
              >
                {interval}
              </button>
            </form>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
