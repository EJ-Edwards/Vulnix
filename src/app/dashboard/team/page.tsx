"use client";

import { useEffect, useState } from "react";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-gray-400">Loading team...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-1">People collaborating on your projects.</p>
      </div>

      <div className="card">
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-medium">
                    {member.name?.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <span className={`badge ${member.role === "admin" ? "badge-red" : "badge-blue"}`}>
                {member.role}
              </span>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              No team members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
