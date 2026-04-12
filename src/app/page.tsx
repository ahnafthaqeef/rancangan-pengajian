"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PlanWithStats } from "@/types";

const DAYS = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];

function SkeletonDay() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 min-h-[90px] animate-pulse">
      <div className="h-3 w-8 bg-gray-200 rounded mb-2" />
      <div className="h-6 w-6 bg-gray-200 rounded" />
    </div>
  );
}

function getWeekDates(anchor: Date): Date[] {
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function WeeklyDashboard() {
  const router = useRouter();
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [plans, setPlans] = useState<PlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const weekDates = getWeekDates(weekAnchor);
  const today = toDateStr(new Date());

  useEffect(() => {
    loadPlans();
  }, [weekAnchor]);

  async function loadPlans() {
    setLoading(true);
    const supabase = createClient();
    const start = toDateStr(weekDates[0]);
    const end = toDateStr(weekDates[6]);

    const { data } = await supabase
      .from("plans")
      .select("*, activities(*)")
      .gte("date", start)
      .lte("date", end)
      .order("date");

    if (data) {
      const enriched = data.map((p) => ({
        ...p,
        completed: p.activities?.filter((a: { done: boolean }) => a.done).length || 0,
        total: p.activities?.length || 0,
      }));
      setPlans(enriched as PlanWithStats[]);
    }
    setLoading(false);
  }

  function prevWeek() {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  }

  function nextWeek() {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  }

  function goToday() {
    setWeekAnchor(new Date());
  }

  const weekLabel = `${weekDates[0].getDate()} ${weekDates[0].toLocaleString("ms-MY", { month: "short" })} – ${weekDates[6].getDate()} ${weekDates[6].toLocaleString("ms-MY", { month: "short", year: "numeric" })}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rancangan Pengajian Harian</h1>
            <p className="text-sm text-gray-500">Pelan pembelajaran harian</p>
          </div>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
            )}
            <Link href={`/plan/new?date=${today}`}
              className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              + Rancangan Baru
            </Link>
            <button onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition-colors">
              Log Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Week navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevWeek} className="text-gray-400 hover:text-gray-700 text-lg px-2">‹</button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
            <button onClick={goToday} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
              Hari ini
            </button>
          </div>
          <button onClick={nextWeek} className="text-gray-400 hover:text-gray-700 text-lg px-2">›</button>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2 mb-8 overflow-x-auto">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <SkeletonDay key={i} />)
            : weekDates.map((date, idx) => {
                const dateStr = toDateStr(date);
                const isToday = dateStr === today;
                const dayPlans = plans.filter((p) => p.date === dateStr);
                const totalActivities = dayPlans.reduce((s, p) => s + p.total, 0);
                const doneActivities = dayPlans.reduce((s, p) => s + p.completed, 0);
                const pct = totalActivities > 0 ? Math.round((doneActivities / totalActivities) * 100) : 0;

                return (
                  <Link key={dateStr} href={`/plan/${dateStr}`}>
                    <div className={`rounded-xl border p-3 cursor-pointer transition-all min-h-[90px] min-w-[80px] group ${
                      isToday
                        ? "border-black border-l-4 bg-white ring-1 ring-black/10"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}>
                      <p className="text-xs font-medium mb-1 text-gray-400">
                        {DAYS[(idx + 1) % 7]}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? "text-black" : "text-gray-900"}`}>
                        {date.getDate()}
                      </p>
                      {dayPlans.length > 0 && (
                        <div className="mt-2">
                          <div className="w-full rounded-full h-1.5 bg-gray-100">
                            <div
                              className="h-1.5 rounded-full bg-green-500 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs mt-1 text-gray-400">
                            {doneActivities}/{totalActivities}
                          </p>
                        </div>
                      )}
                      {dayPlans.length === 0 && (
                        <p className="text-xs mt-2 text-gray-300 group-hover:text-gray-400 transition-colors">+</p>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* This week's plans list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rancangan Minggu Ini</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-48 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400 mb-3">Tiada rancangan minggu ini.</p>
              <Link href={`/plan/new?date=${today}`}
                className="text-sm text-black underline hover:no-underline">
                Cipta rancangan untuk hari ini
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const dateObj = new Date(plan.date + "T00:00:00");
                const dayName = DAYS[dateObj.getDay()];
                const pct = plan.total > 0 ? Math.round((plan.completed / plan.total) * 100) : 0;

                return (
                  <Link key={plan.id} href={`/plan/${plan.date}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md shadow-sm transition-all cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">{dayName}, {plan.date}</span>
                            {plan.date === today && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Hari ini</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900">{plan.subject}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{plan.objective}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            pct === 100 ? "text-green-600" : pct >= 50 ? "text-amber-500" : "text-gray-400"
                          }`}>
                            {pct}%
                          </p>
                          <p className="text-xs text-gray-400">{plan.completed}/{plan.total}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
