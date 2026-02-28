
"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string;
  label: string;
};

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsMessage?: string;
  searchDisabled?: boolean;
}

export function Combobox({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    noResultsMessage = "No results found.",
    searchDisabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = React.useMemo(() => 
    options.find((option) => option.value.toLowerCase() === value?.toLowerCase()), 
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedOption ? selectedOption.label : placeholder}
          
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          {!searchDisabled && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            <CommandEmpty>{noResultsMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentValue) => {
                    const newValue = options.find(o => o.label.toLowerCase() === currentValue.toLowerCase())?.value || "";
                    onChange(newValue);
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value && value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
