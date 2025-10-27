import { LayoutDashboard, Phone, MessageSquare, Users, CheckSquare, Brain, type LucideIcon } from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Calls",
        url: "/dashboard/calls",
        icon: Phone,
        subItems: [
          { title: "Call History", url: "/dashboard/calls/history" },
          { title: "Voicemails", url: "/dashboard/calls/voicemails" },
        ],
      },
      {
        title: "Messages",
        url: "/dashboard/messages",
        icon: MessageSquare,
        subItems: [
          { title: "Unified Inbox", url: "/dashboard/messages/inbox" },
          { title: "SMS", url: "/dashboard/messages/sms" },
          { title: "WhatsApp", url: "/dashboard/messages/whatsapp" },
          { title: "Telegram", url: "/dashboard/messages/telegram" },
        ],
      },
      {
        title: "Contacts",
        url: "/dashboard/contacts",
        icon: Users,
      },
      {
        title: "Tasks",
        url: "/dashboard/tasks",
        icon: CheckSquare,
      },
      {
        title: "AI Recap",
        url: "/dashboard/ai-recap",
        icon: Brain,
      },
    ],
  },
];
