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
        code: searchParams.get('code'),
        error: searchParams.get('error'),
        error_description: searchParams.get('error_description'),
        state: searchParams.get('state'),
        type: searchParams.get('type'),
        access_token: searchParams.get('access_token'),
        refresh_token: searchParams.get('refresh_token'),
      };

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      info.session = { session, sessionError };

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      info.user = { user, userError };

      // Get auth state
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session);
      });

      setDebugInfo(info);

      // Cleanup subscription
      return () => subscription.unsubscribe();
    };

    runDebug();
  }, [searchParams, supabase.auth]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Information</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">URL Parameters</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo.urlParams, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Current Session</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo.session, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Environment Check</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
