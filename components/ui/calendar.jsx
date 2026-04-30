"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  // Default to dropdowns to match your screenshot
  captionLayout = "dropdown-buttons", 
  // Set a default range so the year dropdown appears
  fromYear = 2010,
  toYear = 2030,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      fromYear={fromYear}
      toYear={toYear}
      className={cn(
        // Base Card Styles
        "p-3 bg-[#1e1e1e] border border-zinc-800 rounded-lg shadow-xl",
        className
      )}
      classNames={{
        // Root & Layout
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0", defaultClassNames.months),
        month: cn("space-y-4", defaultClassNames.month),
        
        // Header (Hidden Nav Arrows, visible Dropdowns)
        caption: cn("flex justify-center pt-1 relative items-center", defaultClassNames.caption),
        caption_label: cn("hidden"), // Hide the default text label
        nav: cn("hidden"), // Hide arrows (screenshot implies dropdown navigation)
        
        // The Dropdown Containers
        dropdowns: cn(
          "flex w-full gap-2", // Flex row for Month | Year
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          // The Grey Box Style
          "relative flex-1 flex items-center justify-between bg-[#2b2b2b] hover:bg-[#333] border border-transparent transition-colors rounded-md py-1.5 px-3 cursor-pointer",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          // The actual select element (invisible but clickable)
          "absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer",
          defaultClassNames.dropdown
        ),
        
        // Grid & Days
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        row: "flex w-full mt-2",
        
        // Weekday Headers (Mo, Tu, We...)
        head_cell: "text-zinc-500 rounded-md w-9 font-medium text-[0.8rem]",
        
        // Day Cells
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full aria-selected:opacity-100"
        ),
        
        // Selection States
        day_selected:
          "bg-[#546FFF] text-white hover:bg-[#546FFF] hover:text-white focus:bg-[#546FFF] focus:text-white rounded-full", // The Blue Circle
        day_today: "bg-zinc-800 text-white",
        day_outside: "text-zinc-600 opacity-50",
        day_disabled: "text-zinc-600 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        // Inject the Chevron icon into the dropdown boxes visually
        IconDropdown: () => <ChevronDown className="h-4 w-4 text-zinc-400" />,
      }}
      {...props}
    />
  )
}

export { Calendar }