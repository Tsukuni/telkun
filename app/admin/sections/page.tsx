"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Section {
  id: string;
  name: string;
  floor: number;
  area: number;
  rentPrice: number;
  category: string;
  status: string;
  features: string[];
}

const statusLabels: Record<string, string> = {
  active: "利用可能",
  inactive: "利用停止中",
};

const statusColors: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    floor: "",
    area: "",
    rentPrice: "",
    category: "物販",
    features: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSections = async () => {
    const res = await fetch("/api/sections");
    const data = await res.json();
    setSections(data.sections);
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          floor: Number(formData.floor),
          area: Number(formData.area),
          rentPrice: Number(formData.rentPrice),
          category: formData.category,
          features: formData.features
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description: formData.description,
        }),
      });

      if (res.ok) {
        setFormData({
          name: "",
          floor: "",
          area: "",
          rentPrice: "",
          category: "物販",
          features: "",
          description: "",
        });
        setShowForm(false);
        fetchSections();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm("この区画を削除しますか？関連する問い合わせや予約も削除されます。")
    ) {
      return;
    }

    await fetch(`/api/sections/${id}`, { method: "DELETE" });
    fetchSections();
  };

  if (loading) {
    return <div className="text-zinc-600">読み込み中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          区画管理
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? "キャンセル" : "新規作成"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg bg-white p-6 shadow dark:bg-zinc-800"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            新しい区画を作成
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                区画名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="例: 1F-E"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                階数
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) =>
                  setFormData({ ...formData, floor: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="例: 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                面積（㎡）
              </label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="例: 45"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                日額利用料（円）
              </label>
              <input
                type="number"
                value={formData.rentPrice}
                onChange={(e) =>
                  setFormData({ ...formData, rentPrice: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="例: 15000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              >
                <option value="物販">物販</option>
                <option value="飲食">飲食</option>
                <option value="サービス">サービス</option>
                <option value="オフィス">オフィス</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                特徴（カンマ区切り）
              </label>
              <input
                type="text"
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="例: 角地, 大通り面"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              説明文
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              placeholder="区画の特徴や用途を説明してください"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "作成中..." : "作成"}
          </button>
        </form>
      )}

      <div className="mt-8">
        {sections.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            区画がまだ登録されていません。
          </p>
        ) : (
          <div className="grid gap-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-zinc-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {section.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[section.status] || ""}`}
                    >
                      {statusLabels[section.status] || section.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {section.floor}F · {section.area}㎡ ·{" "}
                    {section.rentPrice.toLocaleString()}円/日 ·{" "}
                    {section.category}
                  </p>
                  {section.features.length > 0 && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {section.features.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/sections/${section.id}`}
                    className="rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  >
                    詳細・問い合わせ
                  </Link>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
