import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Vulnix</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>✨</span> Now with AI-powered project insights
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage projects<br />
            <span className="text-indigo-600">without the chaos</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Vulnix brings your team together with intuitive project management,
            real-time collaboration, and powerful analytics. All in one platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="/login" className="btn btn-secondary text-lg px-8 py-3">
              View Demo
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 pb-24">
          <div className="card p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Boards</h3>
            <p className="text-gray-600">
              Organize tasks with customizable boards, timelines, and workflows. Track progress at a glance.
            </p>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Real-time comments, mentions, and file sharing. Keep your entire team aligned and productive.
            </p>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Powerful insights into team productivity, project velocity, and resource allocation.
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="pb-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple, transparent pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <p className="text-4xl font-bold mb-4">$0<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-8">
                <li>✓ Up to 3 projects</li>
                <li>✓ 1 team member</li>
                <li>✓ Basic features</li>
              </ul>
              <Link href="/register" className="btn btn-secondary w-full">Get Started</Link>
            </div>
            <div className="card p-8 border-2 border-indigo-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-purple">Most Popular</div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-4xl font-bold mb-4">$29<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-8">
                <li>✓ Unlimited projects</li>
                <li>✓ 10 team members</li>
                <li>✓ Priority support</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <Link href="/register" className="btn btn-primary w-full">Start Free Trial</Link>
            </div>
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-1">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">$99<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-gray-600 text-sm mb-8">
                <li>✓ Unlimited everything</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated support</li>
                <li>✓ SSO & SAML</li>
              </ul>
              <Link href="/register" className="btn btn-secondary w-full">Contact Sales</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 Vulnix. All rights reserved.</p>
          <p className="mt-2 text-xs text-gray-400">
            ⚠️ This is an intentionally vulnerable application for security testing purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
