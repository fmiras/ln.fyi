import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const INTERVALS = ['3d', '1w', '1m', '3m', '6m', '1y', '2y', '3y']

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
