"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || []));
    fetch("/api/billing/status").then(r => r.json()).then(d => setBilling(d));
  }, []);

  const activeProjects = projects.filter(p => p.status === "active");
  const completedProjects = projects.filter(p => p.status === "completed");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your projects.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Total Projects</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{activeProjects.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{completedProjects.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Credits</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{billing?.credits || 0}</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm">
            + New Project
          </Link>
        </div>
        <div className="divide-y">
          {projects.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg mb-2">No projects yet</p>
              <Link href="/dashboard/projects/new" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Create your first project →
              </Link>
            </div>
          ) : (
            projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    project.priority === "critical" ? "badge-red" :
                    project.priority === "high" ? "badge-yellow" :
                    project.priority === "medium" ? "badge-blue" : "badge-gray"
                  }`}>
                    {project.priority}
                  </span>
                  <span className={`badge ${
                    project.status === "active" ? "badge-green" :
                    project.status === "completed" ? "badge-blue" : "badge-gray"
                  }`}>
                    {project.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Plan info */}
      {billing && (
        <div className="mt-8 card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Current Plan: {billing.planDetails?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {billing.plan === "free" 
                  ? "Upgrade to Pro for unlimited projects and team members."
                  : `You're on the ${billing.planDetails?.name} plan. ${billing.planDetails?.features?.length} features included.`
                }
              </p>
            </div>
            {billing.plan === "free" && (
              <Link href="/dashboard/billing" className="btn btn-primary btn-sm">
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
