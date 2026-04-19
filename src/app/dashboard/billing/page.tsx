"use client";

import { useEffect, useState } from "react";

export default function BillingPage() {
  const [billing, setBilling] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function loadBilling() {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setBilling(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadBilling(); }, []);

  async function handleChangePlan(plan: string) {
    setMessage("");
    setError("");
    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      loadBilling();
    } else {
      setError(data.error);
    }
  }

  async function handlePromo(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promoCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setPromoCode("");
      loadBilling();
    } else {
      setError(data.error);
    }
  }

  if (loading) return <div className="animate-pulse text-gray-400">Loading billing...</div>;

  const plans = [
    { id: "free", name: "Free", price: "$0/mo", features: ["3 projects", "1 team member", "Basic features"] },
    { id: "pro", name: "Pro", price: "$29/mo", features: ["Unlimited projects", "10 team members", "Priority support", "Advanced analytics"] },
    { id: "enterprise", name: "Enterprise", price: "$99/mo", features: ["Unlimited everything", "Custom integrations", "Dedicated support", "SSO"] },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
      <p className="text-gray-500 mb-8">Manage your plan and credits.</p>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200 mb-6">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Current Plan */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Current Plan</h2>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{billing?.planDetails?.name || billing?.plan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Credits Balance</p>
            <p className="text-2xl font-bold text-gray-900">{billing?.credits || 0}</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 ${billing?.plan === plan.id ? "border-2 border-indigo-600" : ""}`}
          >
            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold mt-1 mb-4">{plan.price}</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {plan.features.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>
            {billing?.plan === plan.id ? (
              <div className="btn btn-secondary w-full cursor-default opacity-60">Current Plan</div>
            ) : (
              <button
                onClick={() => handleChangePlan(plan.id)}
                className={`btn w-full ${plan.id === "pro" ? "btn-primary" : "btn-secondary"}`}
              >
                {plan.id === "free" ? "Downgrade" : "Upgrade"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Promo Code</h2>
        <form onSubmit={handlePromo} className="flex gap-3">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
            className="input flex-1"
          />
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
        </form>
      </div>
    </div>
  );
}
