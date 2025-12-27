import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fromYear,
  toYear,
  defaultMonth,
  ...props
}) {
  const [month, setMonth] = React.useState(defaultMonth || new Date())
  
  // Sync month with defaultMonth prop changes
  React.useEffect(() => {
    if (defaultMonth) {
      setMonth(defaultMonth)
    }
  }, [defaultMonth])
  
  // Generate year options
  const currentYear = new Date().getFullYear()
  const startYear = fromYear || 1900
  const endYear = toYear || currentYear
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse()
  
  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleYearChange = (year) => {
    const newDate = new Date(month)
    newDate.setFullYear(parseInt(year))
    setMonth(newDate)
  }

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(month)
    newDate.setMonth(parseInt(monthIndex))
    setMonth(newDate)
  }

  return (
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "hidden",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell:
          "text-muted-foreground rounded-md w-10 font-semibold text-xs uppercase tracking-wider",
        row: "flex w-full mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal transition-all duration-200 hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100 rounded-md"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold shadow-sm",
        day_outside:
          "day-outside text-muted-foreground opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: ({ displayMonth }) => {
          return (
            <div className="flex justify-center pt-1 relative items-center mb-4 px-8">
              <button
                onClick={() => {
                  const newDate = new Date(displayMonth)
                  newDate.setMonth(displayMonth.getMonth() - 1)
                  setMonth(newDate)
                }}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent transition-all duration-200 absolute left-1 border-0"
                )}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <Select
                  value={displayMonth.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm font-semibold border-2">
                    <SelectValue>{months[displayMonth.getMonth()]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={displayMonth.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="w-[100px] h-8 text-sm font-semibold border-2">
                    <SelectValue>{displayMonth.getFullYear()}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={() => {
                  const newDate = new Date(displayMonth)
                  newDate.setMonth(displayMonth.getMonth() + 1)
                  setMonth(newDate)
                }}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent transition-all duration-200 absolute right-1 border-0"
                )}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

