"use client";

import { format, subMonths } from "date-fns";
import { Phone, PhoneCall, MessageSquare, CheckSquare } from "lucide-react";
import { Area, AreaChart, Line, LineChart, Bar, BarChart, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import {
  callsChartData,
  callsChartConfig,
  missedCallsChartData,
  missedCallsChartConfig,
  callVolumeChartData,
  callVolumeChartConfig,
} from "./crm.config";

const lastMonth = format(subMonths(new Date(), 1), "LLLL");

export function OverviewCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Calls</CardTitle>
          <CardDescription>Today</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer className="size-full min-h-24" config={callsChartConfig}>
            <BarChart accessibilityLayer data={callsChartData} barSize={8}>
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `Today: ${label}`} />} />
              <Bar
                background={{ fill: "var(--color-background)", radius: 4, opacity: 0.07 }}
                dataKey="totalCalls"
                stackId="a"
                fill="var(--color-totalCalls)"
                radius={[0, 0, 0, 0]}
              />
              <Bar dataKey="missedCalls" stackId="a" fill="var(--color-missedCalls)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xl font-semibold tabular-nums">47</span>
          <span className="text-sm font-medium text-green-500">+12.3%</span>
        </CardFooter>
      </Card>

      <Card className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>Missed Calls</CardTitle>
          <CardDescription>Today</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ChartContainer className="size-full min-h-24" config={missedCallsChartConfig}>
            <AreaChart
              data={missedCallsChartData}
              margin={{
                left: 0,
                right: 0,
                top: 5,
              }}
            >
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(label) => `Today: ${label}`} hideIndicator />}
              />
              <Area
                dataKey="missedCalls"
                fill="var(--color-missedCalls)"
                fillOpacity={0.05}
                stroke="var(--color-missedCalls)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="w-fit rounded-lg bg-green-500/10 p-2">
            <MessageSquare className="size-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle>Messages</CardTitle>
            <CardDescription>Today</CardDescription>
          </div>
          <p className="text-2xl font-medium tabular-nums">89</p>
          <div className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">+18.5%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-destructive/10 w-fit rounded-lg p-2">
            <CheckSquare className="text-destructive size-5" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between">
          <div className="space-y-1.5">
            <CardTitle>Follow-ups Due</CardTitle>
            <CardDescription>Today</CardDescription>
          </div>
          <p className="text-2xl font-medium tabular-nums">12</p>
          <div className="text-destructive bg-destructive/10 w-fit rounded-md px-2 py-1 text-xs font-medium">+3</div>
        </CardContent>
      </Card>

      <Card className="col-span-1 xl:col-span-2">
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
