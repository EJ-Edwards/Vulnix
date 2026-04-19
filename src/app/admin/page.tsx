"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "fetch">("users");
  const [loading, setLoading] = useState(true);
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchResult, setFetchResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        /*
          VULNERABILITY: Weak Admin Protection
          When vulnerable, the admin check is client-side only.
          The admin query param ?admin=true is passed to API routes
          which accept it as proof of admin access.
          
          Exploit: Any user can visit /admin?admin=true
          Fix: Server-side role check only
        */
      })
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  useEffect(() => {
    const adminParam = searchParams.get("admin") === "true" ? "?admin=true" : "";
    
    fetch(`/api/admin/users${adminParam}`)
      .then((r) => r.json())
      .then((d) => { if (d.users) setUsers(d.users); });

    fetch(`/api/admin/logs${adminParam}`)
      .then((r) => r.json())
      .then((d) => { if (d.logs) setLogs(d.logs); });
  }, [searchParams]);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!fetchUrl.trim()) return;

    const res = await fetch("/api/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fetchUrl }),
    });
    const data = await res.json();
    setFetchResult(data);
  }

  if (loading) return <div className="animate-pulse text-gray-400 p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <span className="badge badge-red">Admin</span>
          </div>
          <div className="text-sm text-gray-500">
            Logged in as: {user?.name} ({user?.role})
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {(["users", "logs", "fetch"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "users" ? "Users" : tab === "logs" ? "Request Logs" : "URL Fetcher"}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="card">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">All Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">ID</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Role</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Plan</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Credits</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{u.id}</td>
                      <td className="px-6 py-4 font-medium">{u.name}</td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${u.role === "admin" ? "badge-red" : "badge-blue"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-gray">{u.plan}</span>
                      </td>
                      <td className="px-6 py-4">{u.credits}</td>
                      <td className="px-6 py-4 font-mono text-gray-400">
                        {/* VULN: Password visible in admin panel when sensitive data exposure is on */}
                        {u.password || "••••••"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="card">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Request Logs ({logs.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Path</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">IP</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Body</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.slice().reverse().map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          log.method === "GET" ? "badge-green" :
                          log.method === "POST" ? "badge-blue" :
                          log.method === "PUT" ? "badge-yellow" :
                          log.method === "DELETE" ? "badge-red" : "badge-gray"
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">{log.path}</td>
                      <td className="px-4 py-3 text-gray-500">{log.userId || "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.ip}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[200px] truncate">
                        {log.body ? JSON.stringify(log.body) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logs.length === 0 && (
              <div className="p-8 text-center text-gray-400">No logs recorded yet.</div>
            )}
          </div>
        )}

        {/* URL Fetcher Tab (SSRF) */}
        {activeTab === "fetch" && (
          <div>
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">URL Fetcher</h2>
              <p className="text-sm text-gray-500 mb-4">
                Fetch content from external URLs for integration testing.
              </p>
              <form onSubmit={handleFetch} className="flex gap-3">
                <input
                  value={fetchUrl}
                  onChange={(e) => setFetchUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">
                  Fetch
                </button>
              </form>
              <div className="mt-3 text-xs text-gray-400">
                <p>Try these URLs for SSRF testing:</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  <li>• http://169.254.169.254/latest/meta-data</li>
                  <li>• http://169.254.169.254/latest/meta-data/iam/security-credentials</li>
                  <li>• http://localhost:3000/api/debug</li>
                  <li>• http://127.0.0.1:6379</li>
                </ul>
              </div>
            </div>

            {fetchResult && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Response</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(fetchResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
