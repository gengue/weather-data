"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const chartConfig = {
  averageTemperature: {
    label: "Avg. Temperature",
    color: "#2563eb",
  },
  averageHumidity: {
    label: "Avg. Humidity",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

interface Props {
  data: {
    year: string;
    month: string;
    averageTemperature: number;
    averageHumidity: number;
  }[];
}

export function WeatherChart({ data }: Props) {
  const years = Array.from(new Set(data.map((item) => item.year))).sort();
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const filteredData = data.filter((item) => item.year === selectedYear);

  if (data.length === 0) return null;

  return (
    <>
      <div>
        <Select
          onValueChange={(value) => setSelectedYear(value)}
          defaultValue={years[0]}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={filteredData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            tickMargin={5}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="averageTemperature"
            fill="var(--color-averageTemperature)"
            radius={4}
          />
          <Bar
            dataKey="averageHumidity"
            fill="var(--color-averageHumidity)"
            radius={4}
          />
        </BarChart>
      </ChartContainer>
    </>
  );
}
