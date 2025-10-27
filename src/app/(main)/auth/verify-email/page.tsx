"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Mail, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have verification tokens in the URL
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const type = searchParams.get("type");

    if (accessToken && refreshToken && type === "signup") {
      setIsVerifying(true);
      // The middleware will handle the actual verification
      // We just need to show the appropriate UI
      setTimeout(() => {
        setVerificationStatus("success");
        setIsVerifying(false);
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }, 1000);
    }
  }, [searchParams, router]);

  // If user is already verified and logged in, redirect to dashboard
  useEffect(() => {
    if (user && verificationStatus === "pending") {
      router.push("/dashboard");
    }
  }, [user, router, verificationStatus]);

  if (isVerifying) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-4 text-center">
          <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="text-primary h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-medium">Verifying your email...</h1>
          <p className="text-muted-foreground text-sm">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "success") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-medium">Email verified!</h1>
          <p className="text-muted-foreground text-sm">
            Your email has been successfully verified. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "error") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-medium">Verification failed</h1>
          <p className="text-muted-foreground text-sm">
            There was an error verifying your email. The link may have expired.
          </p>
        </div>
        <div className="space-y-4">
          <Link href="/auth/register">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/auth/login">
            <Button className="w-full" variant="outline">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
      <div className="space-y-4 text-center">
        <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="text-primary h-8 w-8" />
        </div>
        <h1 className="text-3xl font-medium">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          We've sent you a verification link. Please check your email and click the link to verify your account.
        </p>
      </div>
      <div className="space-y-4">
        <Link href="/auth/login">
          <Button className="w-full" variant="outline">
            Back to Login
          </Button>
        </Link>
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Didn't receive the email? Check your spam folder or{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              try registering again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
