"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PlanWithStats, Activity } from "@/types";

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const [plans, setPlans] = useState<PlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const dateObj = new Date(date + "T00:00:00");
  const dayLabel = dateObj.toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    loadPlans();
  }, [date]);

  async function loadPlans() {
    const supabase = createClient();
    const { data } = await supabase
      .from("plans")
      .select("*, activities(*)")
      .eq("date", date)
      .order("created_at");

    if (data) {
      const enriched = data.map((p) => {
        const acts = (p.activities || []).sort((a: Activity, b: Activity) => a.sort_order - b.sort_order);
        return {
          ...p,
          activities: acts,
          completed: acts.filter((a: Activity) => a.done).length,
          total: acts.length,
        };
      });
      setPlans(enriched as PlanWithStats[]);
    }
    setLoading(false);
  }

  async function toggleActivity(activity: Activity) {
    setTogglingId(activity.id);
    const supabase = createClient();
    await supabase
      .from("activities")
      .update({ done: !activity.done, done_at: activity.done ? null : new Date().toISOString() })
      .eq("id", activity.id);
    await loadPlans();
    setTogglingId(null);
  }

  async function deletePlan(planId: string) {
    if (!confirm("Padam rancangan ini?")) return;
    const supabase = createClient();
    await supabase.from("plans").delete().eq("id", planId);
    await loadPlans();
  }

  const totalActivities = plans.reduce((s, p) => s + p.total, 0);
  const doneActivities = plans.reduce((s, p) => s + p.completed, 0);
  const overallPct = totalActivities > 0 ? Math.round((doneActivities / totalActivities) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Balik</Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 capitalize">{dayLabel}</h1>
                {date === today && (
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Hari ini</span>
                )}
              </div>
              {totalActivities > 0 && (
                <p className="text-sm text-gray-500">{doneActivities}/{totalActivities} aktiviti selesai · {overallPct}%</p>
              )}
            </div>
          </div>
          <Link href={`/plan/new?date=${date}`}
            className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            + Rancangan
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Overall progress */}
        {totalActivities > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Kemajuan hari ini</span>
              <span className={`text-sm font-bold ${overallPct === 100 ? "text-green-600" : "text-gray-700"}`}>
                {overallPct === 100 ? "Selesai! 🎉" : `${overallPct}%`}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${overallPct === 100 ? "bg-green-500" : "bg-black"}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Memuatkan...</p>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 mb-3">Tiada rancangan untuk hari ini.</p>
            <Link href={`/plan/new?date=${date}`}
              className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm">
              Cipta Rancangan
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {plans.map((plan) => {
              const pct = plan.total > 0 ? Math.round((plan.completed / plan.total) * 100) : 0;
              return (
                <div key={plan.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Plan header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 text-lg">{plan.subject}</h2>
                        <p className="text-sm text-gray-500 mt-1">{plan.objective}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${pct === 100 ? "text-green-600" : "text-gray-700"}`}>
                            {pct}%
                          </p>
                          <p className="text-xs text-gray-400">{plan.completed}/{plan.total}</p>
                        </div>
                        <button onClick={() => deletePlan(plan.id)}
                          className="text-gray-300 hover:text-red-400 text-sm transition-colors">✕</button>
                      </div>
                    </div>
                    {plan.total > 0 && (
                      <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-black"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Activity list */}
                  <div className="divide-y divide-gray-50">
                    {plan.activities.map((activity) => (
                      <button key={activity.id}
                        onClick={() => toggleActivity(activity)}
                        disabled={togglingId === activity.id}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-60">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          activity.done ? "bg-black border-black" : "border-gray-300"
                        }`}>
                          {activity.done && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${activity.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                            {activity.title}
                          </p>
                          {activity.done_at && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Selesai {new Date(activity.done_at).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
