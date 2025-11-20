"use client";

import { Clock } from "lucide-react";
import { Line, LineChart, XAxis } from "recharts";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { aiActionItems, callVolumeChartData, callVolumeChartConfig } from "./crm.config";

export function OperationalCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI-Extracted Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {aiActionItems.map((item) => (
              <li key={item.id} className="space-y-2 rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox defaultChecked={item.checked} />
                  <span className="text-sm font-medium">{item.title}</span>
                  <span
                    className={cn(
                      "w-fit rounded-md px-2 py-1 text-xs font-medium",
                      item.priority === "High" && "text-destructive bg-destructive/20",
                      item.priority === "Medium" && "bg-yellow-500/20 text-yellow-500",
                      item.priority === "Low" && "bg-green-500/20 text-green-500",
                    )}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs font-medium">{item.desc}</div>
                <div className="flex items-center gap-1">
                  <Clock className="text-muted-foreground size-3" />
                  <span className="text-muted-foreground text-xs font-medium">{item.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call Volume Trend</CardTitle>
          <CardDescription>Last 7 Days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={callVolumeChartConfig} className="h-24 w-full">
            <LineChart
              data={callVolumeChartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="calls"
                stroke="var(--color-calls)"
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">+15% increase from last week</p>
        </CardFooter>
      </Card>
    </div>
  );
}
