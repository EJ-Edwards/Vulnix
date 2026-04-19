"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>(null);
  const [displayQuery, setDisplayQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
      setDisplayQuery(data.query); // This is the reflected query
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, users..."
            className="input flex-1 text-lg"
          />
          <button type="submit" className="btn btn-primary px-8">
            Search
          </button>
        </form>

        {displayQuery && (
          <p className="text-sm text-gray-500 mb-6">
            {/* 
              VULNERABILITY: Reflected XSS
              The displayQuery comes from the API response without sanitization (when vulnerable).
              It is rendered via dangerouslySetInnerHTML, allowing script injection.
              Exploit: /search?q=<img src=x onerror=alert('xss')>
              Fix: Always escape HTML entities or use textContent
            */}
            Results for: <span
              className="font-medium text-gray-900"
              dangerouslySetInnerHTML={{ __html: displayQuery }}
            />
          </p>
        )}

        {loading && <div className="animate-pulse text-gray-400">Searching...</div>}

        {results && !loading && (
          <div className="space-y-6">
            {/* Projects */}
            {results.projects?.length > 0 && (
              <div className="card">
                <div className="px-6 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-700 text-sm">
                    Projects ({results.projects.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {results.projects.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/projects/${p.id}`}
                      className="block px-6 py-4 hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users?.length > 0 && (
              <div className="card">
                <div className="px-6 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-700 text-sm">
                    Users ({results.users.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {results.users.map((u: any) => (
                    <div key={u.id} className="px-6 py-4">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.projects?.length === 0 && results.users?.length === 0 && (
              <div className="card p-12 text-center text-gray-400">
                No results found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
