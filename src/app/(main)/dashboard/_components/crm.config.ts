/* eslint-disable max-lines */

import { ChartConfig } from "@/components/ui/chart";

export const callsChartData = [
  { date: "9AM", totalCalls: 8, missedCalls: 2 },
  { date: "10AM", totalCalls: 12, missedCalls: 3 },
  { date: "11AM", totalCalls: 15, missedCalls: 4 },
  { date: "12PM", totalCalls: 6, missedCalls: 1 },
  { date: "1PM", totalCalls: 4, missedCalls: 2 },
  { date: "2PM", totalCalls: 9, missedCalls: 1 },
];

export const callsChartConfig = {
  totalCalls: {
    label: "Total Calls",
    color: "var(--chart-1)",
  },
  missedCalls: {
    label: "Missed Calls",
    color: "var(--chart-3)",
  },
  background: {
    color: "var(--primary)",
  },
} as ChartConfig;

export const missedCallsChartData = [
  { date: "9AM", missedCalls: 2 },
  { date: "10AM", missedCalls: 3 },
  { date: "11AM", missedCalls: 4 },
  { date: "12PM", missedCalls: 1 },
  { date: "1PM", missedCalls: 2 },
  { date: "2PM", missedCalls: 1 },
];

export const missedCallsChartConfig = {
  missedCalls: {
    label: "Missed Calls",
    color: "var(--chart-1)",
  },
} as ChartConfig;

export const callVolumeChartData = [
  { day: "Mon", calls: 45 },
  { day: "Tue", calls: 52 },
  { day: "Wed", calls: 38 },
  { day: "Thu", calls: 61 },
  { day: "Fri", calls: 47 },
  { day: "Sat", calls: 23 },
  { day: "Sun", calls: 18 },
];

export const callVolumeChartConfig = {
  calls: {
    label: "Calls",
    color: "var(--chart-1)",
  },
} as ChartConfig;

export const callsByTypeChartData = [
  { type: "inbound", calls: 28, fill: "var(--color-inbound)" },
  { type: "outbound", calls: 19, fill: "var(--color-outbound)" },
  { type: "missed", calls: 8, fill: "var(--color-missed)" },
  { type: "voicemail", calls: 5, fill: "var(--color-voicemail)" },
];

export const callsByTypeChartConfig = {
  calls: {
    label: "Calls",
  },
  inbound: {
    label: "Inbound",
    color: "var(--chart-1)",
  },
  outbound: {
    label: "Outbound",
    color: "var(--chart-2)",
  },
  missed: {
    label: "Missed",
    color: "var(--chart-3)",
  },
  voicemail: {
    label: "Voicemail",
    color: "var(--chart-4)",
  },
} as ChartConfig;

export const aiActivityChartData = [
  { activity: "AI Summaries Generated", count: 47 },
  { activity: "AI Replies Sent", count: 23 },
  { activity: "Follow-ups Created", count: 12 },
  { activity: "Voicemails Transcribed", count: 8 },
  { activity: "Callbacks Scheduled", count: 5 },
  { activity: "Insights Generated", count: 15 },
];

export const aiActivityChartConfig = {
  count: {
    label: "Count",
    color: "var(--chart-1)",
  },
  activity: {
    label: "Activity",
  },
  label: {
    color: "var(--primary-foreground)",
  },
} as ChartConfig;

export const callConversionChartData = [
  { stage: "Total Calls", value: 60, fill: "var(--chart-1)" },
  { stage: "Answered", value: 45, fill: "var(--chart-2)" },
  { stage: "Completed", value: 38, fill: "var(--chart-3)" },
  { stage: "Follow-up Created", value: 12, fill: "var(--chart-4)" },
];

export const callConversionChartConfig = {
  value: {
    label: "Calls",
    color: "var(--chart-1)",
  },
  stage: {
    label: "Stage",
  },
} as ChartConfig;

export const platformMessagesData = [
  {
    platform: "WhatsApp",
    messages: 45,
    percentage: 42,
    growth: "+15.2%",
    isPositive: true,
  },
  {
    platform: "SMS",
    messages: 32,
    percentage: 30,
    growth: "+8.4%",
    isPositive: true,
  },
  {
    platform: "Telegram",
    messages: 18,
    percentage: 17,
    growth: "+22.1%",
    isPositive: true,
  },
  {
    platform: "Email",
    messages: 12,
    percentage: 11,
    growth: "-2.3%",
    isPositive: false,
  },
];

export const aiActionItems = [
  {
    id: 1,
    title: "Call back Sarah about pool estimate",
    desc: "AI extracted from voicemail: Customer needs quote for pool cleaning service",
    due: "Due today",
    priority: "High",
    priorityColor: "bg-red-100 text-red-700",
    checked: false,
  },
  {
    id: 2,
    title: "Schedule follow-up meeting with Omar",
    desc: "AI suggested: Customer showed interest in premium package during call",
    due: "Due tomorrow",
    priority: "Medium",
    priorityColor: "bg-yellow-100 text-yellow-700",
    checked: true,
  },
  {
    id: 3,
    title: "Send pricing details to Aisha",
    desc: "AI noted: Customer requested pricing information via WhatsApp",
    due: "Due this week",
    priority: "Low",
    priorityColor: "bg-green-100 text-green-700",
    checked: false,
  },
];

export const recentActivityData = [
  {
    id: "A-1012",
    time: "2:30 PM",
    contact: "John Smith",
    type: "Call",
    duration: "3 mins",
    aiSummary: "Requested quote for cleaning service",
  },
  {
    id: "A-1018",
    time: "2:15 PM",
    contact: "Aisha Johnson",
    type: "Missed Call",
    duration: "Voicemail",
    aiSummary: "Wants callback tomorrow about pool estimate",
  },
  {
    id: "A-1005",
    time: "1:45 PM",
    contact: "Adam Wilson",
    type: "WhatsApp",
    duration: "Message",
    aiSummary: "AI suggested reply sent automatically",
  },
  {
    id: "A-1001",
    time: "1:30 PM",
    contact: "Sarah Davis",
    type: "Call",
    duration: "5 mins",
    aiSummary: "Scheduled follow-up meeting for next week",
  },
  {
    id: "A-1003",
    time: "12:15 PM",
    contact: "Omar Hassan",
    type: "SMS",
    duration: "Message",
    aiSummary: "Confirmed appointment for tomorrow",
  },
  {
    id: "A-1008",
    time: "11:30 AM",
    contact: "Lisa Chen",
    type: "Call",
    duration: "2 mins",
    aiSummary: "Left voicemail about pricing inquiry",
  },
  {
    id: "A-1016",
    time: "10:45 AM",
    contact: "Mike Rodriguez",
    type: "Telegram",
    duration: "Message",
    aiSummary: "AI generated response about service hours",
  },
  {
    id: "A-1007",
    time: "10:00 AM",
    contact: "Emma Thompson",
    type: "Call",
    duration: "7 mins",
    aiSummary: "Completed consultation, follow-up created",
  },
  {
    id: "A-1011",
    time: "9:30 AM",
    contact: "David Park",
    type: "Missed Call",
    duration: "Voicemail",
    aiSummary: "AI transcribed voicemail, callback scheduled",
  },
  {
    id: "A-1014",
    time: "9:00 AM",
    contact: "Anna Kowalski",
    type: "WhatsApp",
    duration: "Message",
    aiSummary: "AI suggested pricing information sent",
  },
  {
    id: "A-1010",
    time: "8:45 AM",
    contact: "Tom Brown",
    type: "Call",
    duration: "4 mins",
    aiSummary: "Initial inquiry about services",
  },
  {
    id: "A-1002",
    time: "8:30 AM",
    contact: "Maria Garcia",
    type: "SMS",
    duration: "Message",
    aiSummary: "AI auto-replied with business hours",
  },
  {
    id: "A-1015",
    time: "Yesterday",
    contact: "James Wilson",
    type: "Call",
    duration: "6 mins",
    aiSummary: "Follow-up call completed successfully",
  },
  {
    id: "A-1006",
    time: "Yesterday",
    contact: "Rachel Green",
    type: "WhatsApp",
    duration: "Message",
    aiSummary: "AI sent service confirmation",
  },
  {
    id: "A-1004",
    time: "Yesterday",
    contact: "Chris Lee",
    type: "Call",
    duration: "8 mins",
    aiSummary: "Detailed consultation, proposal sent",
  },
];
