"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const runDebug = async () => {
      const info: any = {};

      // Get URL parameters
      info.urlParams = {
        code: searchParams.get("code"),
        error: searchParams.get("error"),
        error_description: searchParams.get("error_description"),
        state: searchParams.get("state"),
        type: searchParams.get("type"),
        access_token: searchParams.get("access_token"),
        refresh_token: searchParams.get("refresh_token"),
      };

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      info.session = { session, sessionError };

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      info.user = { user, userError };

      // Get auth state
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state change:", event, session);
      });

      setDebugInfo(info);

      // Cleanup subscription
      return () => subscription.unsubscribe();
    };

    runDebug();
  }, [searchParams, supabase.auth]);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Auth Debug Information</h1>

      <div className="space-y-4">
        <div>
          <h2 className="mb-2 text-lg font-semibold">URL Parameters</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4">{JSON.stringify(debugInfo.urlParams, null, 2)}</pre>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Current Session</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4">{JSON.stringify(debugInfo.session, null, 2)}</pre>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Current User</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4">{JSON.stringify(debugInfo.user, null, 2)}</pre>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Environment Check</h2>
          <div className="rounded bg-gray-100 p-4">
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</p>
            <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
