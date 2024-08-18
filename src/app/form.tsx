"use client";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

type Props = {
  action: (input: {
    file: File;
    startDate?: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
    avgPerDate: boolean;
  }) => void;
  isPending: boolean;
  errors?: {
    file?: { _errors?: string[] };
    startDate?: { _errors?: string[] };
    endDate?: { _errors?: string[] };
    startTime?: { _errors?: string[] };
    endTime?: { _errors?: string[] };
    avgPerDate?: { _errors?: string[] };
  };
};

export function Form({ action, isPending, errors }: Props) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 20),
  });
  const [withDateRange, setWithDateRange] = useState(false);
  const [avgPerDate, setAvgPerDate] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    action({
      file: formData.get("file") as File,
      startDate: withDateRange ? date?.from : undefined,
      endDate: withDateRange ? date?.to : undefined,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      avgPerDate,
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="my-4 flex flex-col gap-2 max-w-[400px]"
    >
      <Field label="Excel file" htmlFor="file" errors={errors?.file?._errors}>
        <Input id="file" name="file" type="file" />
      </Field>

      <Field label="Use range of dates" htmlFor="withDateRange">
        <>
          <Switch
            id="withDateRange"
            name="withDateRange"
            checked={withDateRange}
            onCheckedChange={setWithDateRange}
          />
          <span className="text-sm text-muted-foreground w-[210px]">
            {withDateRange
              ? "the process will use the selected date range"
              : "the process will use all dates"}
          </span>
        </>
      </Field>

      {withDateRange && (
        <Field label="Date range" htmlFor="dateRange">
          <DateInput value={date} onChange={setDate} />
        </Field>
      )}

      <div className="inline-flex items-center gap-2 justify-between w-full">
        <Field
          label="Start time"
          htmlFor="startTime"
          errors={errors?.startTime?._errors}
        >
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue="13:00"
          />
        </Field>
        <Field
          label="End time"
          htmlFor="endTime"
          errors={errors?.endTime?._errors}
        >
          <Input id="endTime" type="time" name="endTime" defaultValue="15:00" />
        </Field>
      </div>

      <Field label="Average per date" htmlFor="avgPerDate">
        <>
          <Switch
            id="avgPerDate"
            name="avgPerDate"
            checked={avgPerDate}
            onCheckedChange={setAvgPerDate}
          />
          <span className="text-sm text-muted-foreground w-[210px]">
            {avgPerDate
              ? "Averages per each day"
              : "The total average of the range selected"}
          </span>
        </>
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Process file"}
      </Button>
    </form>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value?: DateRange;
  onChange: SelectRangeEventHandler;
}) {
  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[310px] justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            captionLayout="dropdown-buttons"
            selected={value}
            onSelect={onChange}
            fromYear={2000}
            toYear={new Date().getFullYear() + 1}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Field({
  label,
  children,
  errors = [],
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  errors?: string[];
  htmlFor?: string;
}) {
  return (
    <>
      <div className="inline-flex items-center gap-2">
        <Label htmlFor={htmlFor} className="min-w-20">
          {label}
        </Label>
        {children}
      </div>
      {errors.map((error) => (
        <div key={error} className="text-red-500 text-sm">
          {error}
        </div>
      ))}
    </>
  );
}
