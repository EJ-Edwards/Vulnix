"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-gray-400">Loading projects...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/projects/new" className="btn btn-primary">
          + New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/projects/${project.id}`}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
              <span className={`badge ${
                project.priority === "critical" ? "badge-red" :
                project.priority === "high" ? "badge-yellow" :
                project.priority === "medium" ? "badge-blue" : "badge-gray"
              }`}>
                {project.priority}
              </span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
            <div className="flex items-center justify-between">
              <span className={`badge ${
                project.status === "active" ? "badge-green" :
                project.status === "completed" ? "badge-blue" : "badge-gray"
              }`}>
                {project.status}
              </span>
              <span className="text-xs text-gray-400">
                {project.teamIds?.length || 0} member{project.teamIds?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">No projects yet</p>
          <Link href="/dashboard/projects/new" className="btn btn-primary">
            Create Your First Project
          </Link>
        </div>
      )}
    </div>
  );
}
