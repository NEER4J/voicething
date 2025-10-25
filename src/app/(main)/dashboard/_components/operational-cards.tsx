"use client";

import { Clock } from "lucide-react";
import { FunnelChart, Funnel, LabelList } from "recharts";

import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, cn } from "@/lib/utils";

import { callConversionChartData, callConversionChartConfig, platformMessagesData, aiActionItems } from "./crm.config";

export function OperationalCards() {
  const totalMessages = platformMessagesData.reduce((sum, platform) => sum + platform.messages, 0);
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Call Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer config={callConversionChartConfig} className="size-full">
            <FunnelChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <Funnel className="stroke-card stroke-2" dataKey="value" data={callConversionChartData}>
                <LabelList className="fill-foreground stroke-0" dataKey="stage" position="right" offset={10} />
                <LabelList className="fill-foreground stroke-0" dataKey="value" position="left" offset={10} />
              </Funnel>
            </FunnelChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">Call completion rate improved by 12.5% this week.</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages by Platform</CardTitle>
          <CardDescription className="font-medium tabular-nums">
            {totalMessages} total messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {platformMessagesData.map((platform) => (
              <div key={platform.platform} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{platform.platform}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold tabular-nums">
                      {platform.messages}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        platform.isPositive ? "text-green-500" : "text-destructive",
                      )}
                    >
                      {platform.growth}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={platform.percentage} />
                  <span className="text-muted-foreground text-xs font-medium tabular-nums">{platform.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-muted-foreground flex justify-between gap-1 text-xs">
            <span>{platformMessagesData.length} platforms active</span>
            <span>•</span>
            <span>{platformMessagesData.filter((p) => p.isPositive).length} platforms growing</span>
          </div>
        </CardFooter>
      </Card>

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
    </div>
  );
}
