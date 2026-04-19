"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/comments`).then(r => r.json()),
    ]).then(([projData, commData]) => {
      if (projData.project) {
        setProject(projData.project);
        setEditName(projData.project.name);
        setEditDesc(projData.project.description);
      }
      setComments(commData.comments || []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const res = await fetch(`/api/projects/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments([...comments, data.comment]);
      setNewComment("");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc }),
    });
    const data = await res.json();
    if (res.ok) {
      setProject(data.project);
      setEditing(false);
    } else {
      setError(data.error || "Update failed");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/projects");
    }
  }

  if (loading) return <div className="animate-pulse text-gray-400">Loading project...</div>;
  if (!project) return <div className="text-red-500">Project not found</div>;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/projects" className="hover:text-gray-700">Projects</Link>
        <span>/</span>
        <span className="text-gray-900">{project.name}</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Project Header */}
      <div className="card p-6 mb-6">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input text-xl font-bold"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="input min-h-[80px]"
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-500 mt-2">{project.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                  Edit
                </button>
                <button onClick={handleDelete} className="btn btn-danger btn-sm">
                  Delete
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className={`badge ${
                project.status === "active" ? "badge-green" :
                project.status === "completed" ? "badge-blue" : "badge-gray"
              }`}>
                {project.status}
              </span>
              <span className={`badge ${
                project.priority === "critical" ? "badge-red" :
                project.priority === "high" ? "badge-yellow" :
                project.priority === "medium" ? "badge-blue" : "badge-gray"
              }`}>
                {project.priority}
              </span>
              <span className="text-sm text-gray-400">
                {project.teamIds?.length || 0} team member{project.teamIds?.length !== 1 ? "s" : ""}
              </span>
              <span className="text-sm text-gray-400">
                ID: {project.id}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Comments Section */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Comments ({comments.length})
          </h2>
        </div>

        <div className="divide-y">
          {comments.map((comment) => (
            <div key={comment.id} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">{comment.authorName}</span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              {/* 
                VULNERABILITY: Stored XSS
                When vulnerable, comment.content contains raw HTML that is rendered via dangerouslySetInnerHTML.
                Exploit: Post a comment containing <img src=x onerror=alert('xss')>
                Fix: Use textContent or sanitize HTML before rendering
              */}
              <div
                className="text-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            </div>
          ))}

          {comments.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No comments yet. Be the first to comment.
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
