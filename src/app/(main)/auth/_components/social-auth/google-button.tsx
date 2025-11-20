"use client";

import { useState } from "react";

import { siGoogle } from "simple-icons";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log("Initiating Google OAuth...");

      const { error } = await signInWithGoogle();

      if (error) {
        console.error("Google sign-in error:", error);
        toast.error("Google sign-in failed", {
          description: error,
        });
        setIsLoading(false);
      }
      // Don't set loading to false if successful - the OAuth redirect will happen
      // The OAuth flow will redirect to /auth/callback which then redirects to dashboard/onboarding
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support if the issue persists.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-card dark:border-input dark:hover:bg-accent/50 w-full",
        className,
      )}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      {...props}
    >
      <SimpleIcon icon={siGoogle} className="size-4 shrink-0" />
      {isLoading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
}
