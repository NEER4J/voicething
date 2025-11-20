import Link from "next/link";

import { Globe } from "lucide-react";

import { LoginForm } from "@/app/(main)/auth/_components/login-form";
import { GoogleButton } from "@/app/(main)/auth/_components/social-auth/google-button";
import { ThemeSwitcher } from "@/app/(main)/dashboard/_components/sidebar/theme-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_CONFIG } from "@/config/app-config";

const ERROR_MESSAGES: Record<string, string> = {
  callback_error: "OAuth authentication failed. Please try again.",
  session_missing: "Session could not be established. Please try again.",
  no_code: "OAuth code not received. Please try again.",
};

export default async function LoginV2({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  let errorMessage: string | null = null;
  if (error && typeof error === "string") {
    switch (error) {
      case "callback_error":
        errorMessage = ERROR_MESSAGES.callback_error;
        break;
      case "session_missing":
        errorMessage = ERROR_MESSAGES.session_missing;
        break;
      case "no_code":
        errorMessage = ERROR_MESSAGES.no_code;
        break;
      default:
        errorMessage = "An error occurred. Please try again.";
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Login to your account</h1>
          <p className="text-muted-foreground text-sm">Please enter your details to login.</p>
        </div>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <GoogleButton />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">Or continue with</span>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link className="text-foreground" href="register">
            Register
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="flex items-center gap-1 text-sm">
            <Globe className="text-muted-foreground size-4" />
            ENG
          </div>
        </div>
      </div>
    </>
  );
}
