"use client";

import { useState } from "react";

import { CheckCircle, Settings, MessageCircle, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChannelsStepProps {
  onNext: (data: { whatsapp_connected: boolean; telegram_connected: boolean }) => void;
  onSkip: () => void;
  onBack: () => void;
  initialData?: Partial<{ whatsapp_connected: boolean; telegram_connected: boolean }>;
  isLoading?: boolean;
}

export function ChannelsStep({ onNext, onSkip, onBack, initialData, isLoading }: ChannelsStepProps) {
  const [whatsappConnected, setWhatsappConnected] = useState(initialData?.whatsapp_connected ?? false);
  const [telegramConnected, setTelegramConnected] = useState(initialData?.telegram_connected ?? false);

  const handleWhatsAppConnect = () => {
    // Mock connection process
    setTimeout(() => {
      setWhatsappConnected(true);
    }, 1500);
  };

  const handleTelegramConnect = () => {
    // Mock connection process
    setTimeout(() => {
      setTelegramConnected(true);
    }, 1500);
  };

  const handleContinue = () => {
    onNext({
      whatsapp_connected: whatsappConnected,
      telegram_connected: telegramConnected,
    });
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-medium">Connect Chat Channels</h1>
        <p className="text-muted-foreground text-sm">Add WhatsApp or Telegram now, or skip for later.</p>
      </div>

      <div className="space-y-4">
        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-base">WhatsApp Business</CardTitle>
                  <CardDescription className="text-sm">Connect your WhatsApp Business account</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!whatsappConnected ? (
              <Button onClick={handleWhatsAppConnect} className="w-full" variant="outline">
                Connect WhatsApp Business
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="size-4" />
                WhatsApp Business connected successfully
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-base">Telegram Bot</CardTitle>
                  <CardDescription className="text-sm">Connect your Telegram bot</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!telegramConnected ? (
              <Button onClick={handleTelegramConnect} className="w-full" variant="outline">
                Connect Telegram Bot
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="size-4" />
                Telegram Bot connected successfully
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-muted-foreground text-sm">
            You can connect these channels later from your dashboard settings.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </div>
            ) : (
              "Launch Your AI Assistant"
            )}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
