import { ReactNode } from "react";

import { Command } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="bg-primary relative order-2 hidden h-full overflow-hidden rounded-3xl lg:flex">
          {/* Silk background */}
          {/* <div className="absolute inset-0 z-0">
            <Silk speed={3} scale={1} color="#74ff84" noiseIntensity={5} rotation={-1.2} />
          </div> */}

          {/* Content overlay */}
          <div className="relative z-10 flex w-full flex-col">
            <div className="text-primary-foreground absolute top-10 space-y-1 px-10">
              <Command className="size-10" />
              <h1 className="text-2xl font-medium">{APP_CONFIG.name}</h1>
              <p className="text-sm">AI Voice Agents. Intelligent Conversations. Seamless Integration.</p>
            </div>

            <div className="absolute bottom-10 flex w-full justify-between px-10">
              <div className="text-primary-foreground flex-1 space-y-1">
                <h2 className="font-medium">Ready to deploy?</h2>
                <p className="text-sm">
                  Create your first AI voice agent and start building intelligent conversations in minutes.
                </p>
              </div>
              <Separator orientation="vertical" className="mx-3 !h-auto" />
              <div className="text-primary-foreground flex-1 space-y-1">
                <h2 className="font-medium">Need help?</h2>
                <p className="text-sm">
                  Explore our documentation or join our community to get support with your AI voice agents.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
