"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function NewPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [date, setDate] = useState(defaultDate);
  const [subject, setSubject] = useState("");
  const [objective, setObjective] = useState("");
  const [activities, setActivities] = useState(["", "", ""]);

  function updateActivity(i: number, value: string) {
    const updated = [...activities];
    updated[i] = value;
    setActivities(updated);
  }

  function addActivity() {
    setActivities([...activities, ""]);
  }

  function removeActivity(i: number) {
    if (activities.length <= 1) return;
    setActivities(activities.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validActivities = activities.filter((a) => a.trim());
    if (!subject.trim() || !objective.trim()) {
      setError("Mata pelajaran dan objektif diperlukan.");
      return;
    }
    if (validActivities.length === 0) {
      setError("Sekurang-kurangnya satu aktiviti diperlukan.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      setError("Sila log masuk untuk menyimpan rancangan.");
      setSaving(false);
      return;
    }

    // Upsert plan (allow re-creating for same date+subject)
    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .upsert({ user_id: userId, date, subject: subject.trim(), objective: objective.trim() },
               { onConflict: "user_id,date,subject" })
      .select()
      .single();

    if (planErr || !plan) {
      setError(planErr?.message || "Gagal menyimpan rancangan.");
      setSaving(false);
      return;
    }

    // Insert activities
    const activityRows = validActivities.map((title, idx) => ({
      plan_id: plan.id,
      title: title.trim(),
      done: false,
      sort_order: idx,
    }));

    const { error: actErr } = await supabase.from("activities").insert(activityRows);
    if (actErr) {
      setError(actErr.message);
      setSaving(false);
      return;
    }

    router.push(`/plan/${date}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Balik</Link>
          <h1 className="text-lg font-bold text-gray-900">Rancangan Baru</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Plan Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Maklumat Rancangan</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran / Topik</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="cth. React Hooks, Algoritma Sorting, Excel"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objektif Hari Ini</label>
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)}
                placeholder="cth. Faham cara useEffect berfungsi dan bila digunakan"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                required />
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Aktiviti Pembelajaran</h2>
              <span className="text-sm text-gray-400">{activities.filter((a) => a.trim()).length} aktiviti</span>
            </div>

            <div className="space-y-2">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5 text-center">{i + 1}.</span>
                  <input type="text" value={activity} onChange={(e) => updateActivity(i, e.target.value)}
                    placeholder={`Aktiviti ${i + 1}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                  <button type="button" onClick={() => removeActivity(i)}
                    disabled={activities.length <= 1}
                    className="text-red-400 hover:text-red-600 disabled:opacity-20 text-sm">✕</button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addActivity}
              className="mt-3 text-sm text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 rounded-lg w-full py-2 hover:border-gray-500 transition-colors">
              + Tambah Aktiviti
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60">
            {saving ? "Menyimpan..." : "Simpan Rancangan"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function NewPlan() {
  return (
    <Suspense>
      <NewPlanForm />
    </Suspense>
  );
}
