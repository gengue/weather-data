"use client";
import { useState } from "react";
import { useStateAction } from "next-safe-action/stateful-hooks";
import Spreadsheet from "react-spreadsheet";
import { Download } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { processFile } from "./actions";
import { Form } from "./form";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function Home() {
  const { execute, result, isPending } = useStateAction(processFile);
  const [showPreview, setShowPreview] = useState(true);

  const shouldShowPreview =
    showPreview && result?.data && result?.data?.length > 10;

  const sheetData = (
    shouldShowPreview ? result?.data?.slice(0, 10) : result?.data
  )?.map((row) => [
    { value: row.date, readOnly: true },
    { value: row.avgTemperature.toFixed(4), readOnly: true },
    { value: row.avgHumidity.toFixed(4), readOnly: true },
    { value: row.avgSaturationDeficit.toFixed(4), readOnly: true },
    { value: row.minTemperature.toFixed(4), readOnly: true },
    { value: row.maxTemperature.toFixed(4), readOnly: true },
    { value: row.minHumidity.toFixed(4), readOnly: true },
    { value: row.maxHumidity.toFixed(4), readOnly: true },
    { value: row.minSaturationDeficit.toFixed(4), readOnly: true },
    { value: row.maxSaturationDeficit.toFixed(4), readOnly: true },
    { value: row.cummlativePrecipitation.toFixed(4), readOnly: true },
    { value: row.startTime, readOnly: true },
    { value: row.endTime, readOnly: true },
  ]);

  const columnLabels = [
    "Date",
    "AVG Temp",
    "AVG Hum",
    "AVG Sat. Def.",
    "Min Temp.",
    "Max Temp.",
    "Min Hum.",
    "Max Hum.",
    "Min Sat. Def",
    "Max Sat. Def.",
    "Precip.",
    "Start Time",
    "End Time",
  ];

  const handleDownload = () => {
    if (!result?.data) return;
    const data = result?.data.map((row) => [
      row.date,
      row.avgTemperature.toFixed(4),
      row.avgHumidity.toFixed(4),
      row.avgSaturationDeficit.toFixed(4),
      row.minTemperature.toFixed(4),
      row.maxTemperature.toFixed(4),
      row.minHumidity.toFixed(4),
      row.maxHumidity.toFixed(4),
      row.minSaturationDeficit.toFixed(4),
      row.maxSaturationDeficit.toFixed(4),
      row.cummlativePrecipitation.toFixed(4),
      row.startTime,
      row.endTime,
    ]);

    const csv = [
      columnLabels.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weather_data.csv";
    a.click();
  };

  return (
    <main className="flex flex-col flex-wrap p-4">
      <h1 className="text-4xl font-bold text-center w-full mb-4">
        Process Weather data
      </h1>
      <div className="mx-auto mb-2">
        <Form
          action={execute}
          isPending={isPending}
          errors={result.validationErrors}
        />
        {result?.serverError && (
          <Alert variant="destructive" className="w-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{result.serverError}</AlertDescription>
          </Alert>
        )}
      </div>
      <div className="w-full flex flex-col items-center justify-center max-w-[92rem] mx-auto">
        {sheetData && sheetData.length === 0 && !isPending && (
          <Alert className="w-auto">
            <AlertTitle>No data to display</AlertTitle>
            <AlertDescription>
              Please upload a different file or change the parameters.
            </AlertDescription>
          </Alert>
        )}

        {isPending && <ResultSkeleton />}

        {sheetData && sheetData.length > 0 && !isPending && (
          <>
            <div className="flex flex-col mb-2 text-center">
              <h2 className="text-2xl font-bold w-full ">Preview data</h2>
              {shouldShowPreview && (
                <p className="text-slate-500">Displaying first 10 elements</p>
              )}
            </div>
            <div className="flex justify-end w-full mb-4">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download full spreadsheet
              </Button>
            </div>
            <Spreadsheet
              data={sheetData}
              columnLabels={columnLabels}
              className=""
            />
            {shouldShowPreview && (
              <div className="flex items-center justify-center my-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Show all
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col text-center">
      <div className="self-center">
        <Skeleton className="h-6 w-[200px] mb-4 " />
      </div>
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 5 * 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-[100px]" />
        ))}
      </div>
    </div>
  );
}
