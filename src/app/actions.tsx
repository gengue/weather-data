"use server";
import ExcelJS from "exceljs";
import { formatISO, compareAsc, compareDesc, parseISO } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { ParserError } from "@/lib/errors";

const excelMimeTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const inputSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      return excelMimeTypes.includes(file.type);
    },
    { message: "Invalid file type. Only xls and xlsx files are accepted" },
  ),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startTime: z.string().regex(timeRegex, "Invalid time format"),
  endTime: z.string().regex(timeRegex, "Invalid time format"),
  avgPerDate: z.boolean(),
});

type ActionResult = {
  date: string;
  avgTemperature: number;
  avgHumidity: number;
  avgSaturationDeficit: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  minSaturationDeficit: number;
  maxSaturationDeficit: number;
  cummlativePrecipitation: number;
  startTime: string;
  endTime: string;
}[];

export const processFile = actionClient
  .schema(inputSchema)
  .stateAction<ActionResult>(
    async ({
      parsedInput: { file, startDate, endDate, startTime, endTime, avgPerDate },
    }) => {
      const withDateRange = startDate && endDate;
      const jsonData = await parseSpreadsheet(file);
      const filteredData = jsonData
        .filter((row) => {
          if (withDateRange) {
            const date = parseISO(row.date);
            const minCheck = compareAsc(date, startDate);
            const maxCheck = compareDesc(date, endDate);
            return minCheck >= 0 && maxCheck >= 0;
          }
          return true;
        })
        .filter((row) => {
          const time = row.time;
          return time >= `${startTime}:00` && time <= `${endTime}:00`;
        });

      if (filteredData.length === 0) return [];

      const result = [];
      if (avgPerDate) {
        const groupedData = Object.groupBy(filteredData, (item) => item.date);
        for (const date in groupedData) {
          const data = groupedData[date];
          if (!data?.length || data?.length === 0) continue;

          const cal = calculate(data);
          result.push({
            date,
            avgTemperature: cal.avgTemperature,
            avgHumidity: cal.avgHumidity,
            avgSaturationDeficit: cal.avgSaturationDeficit,
            minTemperature: cal.minTemperature,
            maxTemperature: cal.maxTemperature,
            minHumidity: cal.minHumidity,
            maxHumidity: cal.maxHumidity,
            minSaturationDeficit: cal.minSaturationDeficit,
            maxSaturationDeficit: cal.maxSaturationDeficit,
            cummlativePrecipitation: cal.cummlativePrecipitation,
            startTime: cal.startTime,
            endTime: cal.endTime,
          });
        }
      } else {
        // use all data
        const cal = calculate(filteredData);

        result.push({
          date: withDateRange
            ? `${startDate?.toLocaleString()} - ${endDate?.toLocaleString()}`
            : "All",
          avgTemperature: cal.avgTemperature,
          avgHumidity: cal.avgHumidity,
          avgSaturationDeficit: cal.avgSaturationDeficit,
          minTemperature: cal.minTemperature,
          maxTemperature: cal.maxTemperature,
          minHumidity: cal.minHumidity,
          maxHumidity: cal.maxHumidity,
          minSaturationDeficit: cal.minSaturationDeficit,
          maxSaturationDeficit: cal.maxSaturationDeficit,
          cummlativePrecipitation: cal.cummlativePrecipitation,
          startTime: cal.startTime,
          endTime: cal.endTime,
        });
      }

      return result;
    },
  );

interface WeatherData {
  date: string;
  time: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  logger: string;
  saturationDeficit: number;
}

async function parseSpreadsheet(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1); // Get the first sheet
  if (!worksheet) {
    throw new ParserError("No worksheet found in the file");
  }

  // validate headers are correct
  const headers = (worksheet.getRow(1).values as string[]).filter(Boolean);
  const expectedHeaders = [
    "Date",
    "Time",
    "Temperature",
    "Humidity",
    "Precipitation",
    "Logger",
    "Saturation Deficit",
  ];
  if (!headers) throw new ParserError("No headers found in the file");

  if (headers.length < expectedHeaders.length) {
    throw new ParserError(
      `Missing headers in the file. Expected: ${expectedHeaders.join(", ")}`,
    );
  }

  const jsonData: WeatherData[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Skip header row
      const rowData: WeatherData = {
        date: parseDateCell(row, 1),
        time: parseTimeCell(row, 2),
        temperature: parseNumberCell(row, 3),
        humidity: parseNumberCell(row, 4),
        logger: row.getCell(5).text.trim(),
        precipitation: parseNumberCell(row, 6),
        saturationDeficit: parseNumberCell(row, 7),
      };
      jsonData.push(rowData);
    }
  });
  return jsonData;
}

function calculate(data: WeatherData[]) {
  const minStartTime = data.reduce(
    (acc, item) => (item.time < acc ? item.time : acc),
    data[0].time,
  );
  const maxEndTime = data.reduce(
    (acc, item) => (item.time > acc ? item.time : acc),
    data[0].time,
  );

  const avgTemperature =
    data.reduce((acc, item) => acc + item.temperature, 0) / data.length;
  const avgHumidity =
    data.reduce((acc, item) => acc + item.humidity, 0) / data.length;
  const avgSaturationDeficit =
    data.reduce((acc, item) => acc + item.saturationDeficit, 0) / data.length;

  const minTemperature = Math.min(...data.map((item) => item.temperature));
  const maxTemperature = Math.max(...data.map((item) => item.temperature));
  const minHumidity = Math.min(...data.map((item) => item.humidity));
  const maxHumidity = Math.max(...data.map((item) => item.humidity));
  const minSaturationDeficit = Math.min(
    ...data.map((item) => item.saturationDeficit),
  );
  const maxSaturationDeficit = Math.max(
    ...data.map((item) => item.saturationDeficit),
  );

  const cummlativePrecipitation = data.reduce(
    (acc, item) => acc + item.precipitation,
    0,
  );

  return {
    avgTemperature,
    avgHumidity,
    avgSaturationDeficit,
    minTemperature,
    maxTemperature,
    minHumidity,
    maxHumidity,
    minSaturationDeficit,
    maxSaturationDeficit,
    cummlativePrecipitation,
    startTime: formatTime(minStartTime),
    endTime: formatTime(maxEndTime),
  };
}

function parseNumberCell(row: ExcelJS.Row, column: number) {
  if (typeof row.getCell(column).value !== "number") {
    return 0;
  }
  return row.getCell(column).value as number;
}

function parseDateCell(row: ExcelJS.Row, column: number) {
  const result = format(
    toZonedTime(row.getCell(column).value as Date, "UTC"),
    "yyyy-MM-dd",
    { timeZone: "UTC" },
  );
  return result;
}

function parseTimeCell(row: ExcelJS.Row, column: number) {
  return format(
    toZonedTime(row.getCell(column).value as Date, "UTC"),
    "HH:mm:ss",
    { timeZone: "UTC" },
  );
}

function formatTime(time: string): string {
  // Example input: "13:00:00+01:00"
  return time.slice(0, 5); // Output: "13:00"
}
