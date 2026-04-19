"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setName(d.user.name || "");
          setEmail(d.user.email || "");
          setBio(d.user.bio || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, bio }),
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setMessage("Profile updated successfully!");
    } else {
      setError(data.error || "Update failed");
    }
  }

  if (loading) return <div className="animate-pulse text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 mb-8">Manage your account and profile.</p>

      <div className="card p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-400 mt-1">Supports basic formatting.</p>
          </div>

          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-8 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">User ID</dt>
            <dd className="text-gray-900 font-mono">{user?.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Role</dt>
            <dd><span className={`badge ${user?.role === "admin" ? "badge-red" : "badge-blue"}`}>{user?.role}</span></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Plan</dt>
            <dd><span className={`badge ${
              user?.plan === "enterprise" ? "badge-purple" :
              user?.plan === "pro" ? "badge-blue" : "badge-gray"
            }`}>{user?.plan}</span></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Credits</dt>
            <dd className="text-gray-900">{user?.credits}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Member Since</dt>
            <dd className="text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
