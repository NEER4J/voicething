import { ReactNode } from "react";

import { cookies } from "next/headers";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/auth-actions";
import { checkOnboardingStatus } from "@/server/onboarding-actions";
import { getPreference } from "@/server/server-actions";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
  type NavbarStyle,
} from "@/types/preferences/layout";

import { AccountSwitcher } from "./_components/sidebar/account-switcher";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";

interface DashboardHeaderProps {
  navbarStyle: NavbarStyle;
  userData: ReturnType<typeof transformUserData>;
}

function DashboardHeader({ navbarStyle, userData }: DashboardHeaderProps) {
  return (
    <header
      data-navbar-style={navbarStyle}
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        "data-[navbar-style=sticky]:bg-background/50 data-[navbar-style=sticky]:sticky data-[navbar-style=sticky]:top-0 data-[navbar-style=sticky]:z-50 data-[navbar-style=sticky]:overflow-hidden data-[navbar-style=sticky]:rounded-t-[inherit] data-[navbar-style=sticky]:backdrop-blur-md",
      )}
    >
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <SearchDialog />
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <AccountSwitcher users={[userData]} />
        </div>
      </div>
    </header>
  );
}

async function getUserPreferences(user: any) {
  const [sidebarVariant, sidebarCollapsible, contentLayout, navbarStyle, isOnboardingCompleted] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "sidebar"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "full-width"),
    getPreference<NavbarStyle>("navbar_style", NAVBAR_STYLE_VALUES, "scroll"),
    checkOnboardingStatus(user.id),
  ]);

  return {
    sidebarVariant,
    sidebarCollapsible,
    contentLayout,
    navbarStyle,
    isOnboardingCompleted,
  };
}

function transformUserData(user: any) {
  const metadata = user.user_metadata ?? {};
  const email = user.email ?? "";
  const name = metadata.full_name ?? metadata.name ?? email.split("@")[0] ?? "User";

  return {
    id: user.id,
    name,
    email,
    avatar: metadata.avatar_url ?? "",
    role: metadata.role ?? "user",
  };
}

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Require authentication
  const user = await requireAuth();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const preferences = await getUserPreferences(user);
  const userData = transformUserData(user);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        variant={preferences.sidebarVariant}
        collapsible={preferences.sidebarCollapsible}
        isOnboardingCompleted={preferences.isOnboardingCompleted}
      />
      <SidebarInset
        data-content-layout={preferences.contentLayout}
        className={cn(
          "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
          // Adds right margin for inset sidebar in centered layout up to 113rem.
          // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
          "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
        )}
      >
        <DashboardHeader navbarStyle={preferences.navbarStyle} userData={userData} />
        <div className="h-full p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
