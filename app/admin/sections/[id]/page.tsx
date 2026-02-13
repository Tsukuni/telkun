"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import SectionCalendar from "./calendar";

interface Inquiry {
  id: string;
  callerName: string;
  callerPhone: string;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  tenantName: string;
  purpose: string;
  note: string;
  createdAt: string;
}

interface Section {
  id: string;
  name: string;
  floor: number;
  area: number;
  rentPrice: number;
  category: string;
  status: string;
  features: string[];
  description: string;
  inquiries: Inquiry[];
  reservations: Reservation[];
}

const statusLabels: Record<string, string> = {
  active: "利用可能",
  inactive: "利用停止中",
};

const inquiryStatusLabels: Record<string, string> = {
  new: "新規",
  contacted: "対応済み",
  closed: "クローズ",
};

const inquiryStatusColors: Record<string, string> = {
  new: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  contacted:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

export default function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    floor: "",
    area: "",
    rentPrice: "",
    category: "物販",
    status: "active",
    features: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchSection = async () => {
    const res = await fetch(`/api/sections/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSection(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSection();
  }, [id]);

  const startEditing = () => {
    if (!section) return;
    setEditForm({
      name: section.name,
      description: section.description,
      floor: String(section.floor),
      area: String(section.area),
      rentPrice: String(section.rentPrice),
      category: section.category,
      status: section.status,
      features: section.features.join(", "),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          floor: Number(editForm.floor),
          area: Number(editForm.area),
          rentPrice: Number(editForm.rentPrice),
          category: editForm.category,
          status: editForm.status,
          features: editForm.features
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setEditing(false);
      fetchSection();
    } finally {
      setSaving(false);
    }
  };

  const handleInquiryStatusChange = async (
    inquiryId: string,
    newStatus: string
  ) => {
    await fetch(`/api/inquiries/${inquiryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchSection();
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!confirm("この問い合わせを削除しますか？")) {
      return;
    }

    await fetch(`/api/inquiries/${inquiryId}`, { method: "DELETE" });
    fetchSection();
  };

  if (loading) {
    return <div className="text-zinc-600">読み込み中...</div>;
  }

  if (!section) {
    return <div className="text-red-600">区画が見つかりません</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/sections"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 区画一覧に戻る
        </Link>
      </div>

      {editing ? (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            区画情報を編集
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                区画名
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                説明文
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  階数
                </label>
                <input
                  type="number"
                  value={editForm.floor}
                  onChange={(e) =>
                    setEditForm({ ...editForm, floor: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  面積（㎡）
                </label>
                <input
                  type="number"
                  value={editForm.area}
                  onChange={(e) =>
                    setEditForm({ ...editForm, area: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  日額利用料（円）
                </label>
                <input
                  type="number"
                  value={editForm.rentPrice}
                  onChange={(e) =>
                    setEditForm({ ...editForm, rentPrice: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  カテゴリ
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
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
                  ステータス
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                >
                  <option value="active">利用可能</option>
                  <option value="inactive">利用停止中</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                特徴（カンマ区切り）
              </label>
              <input
                type="text"
                value={editForm.features}
                onChange={(e) =>
                  setEditForm({ ...editForm, features: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {section.name}
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {section.floor}F · {section.area}㎡ ·{" "}
              {section.rentPrice.toLocaleString()}円/日 · {section.category}
            </p>
            {section.features.length > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                特徴: {section.features.join(", ")}
              </p>
            )}
            {section.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {section.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
              {statusLabels[section.status] || section.status}
            </span>
            <button
              onClick={startEditing}
              className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              編集
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          問い合わせ一覧
        </h2>

        {section.inquiries.length === 0 ? (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            問い合わせはまだありません。
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {section.inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {inquiry.callerName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${inquiryStatusColors[inquiry.status] || ""}`}
                      >
                        {inquiryStatusLabels[inquiry.status] || inquiry.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {inquiry.callerPhone} · {inquiry.inquiryType}
                    </p>
                    <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                      {inquiry.message}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(inquiry.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {inquiry.status === "new" && (
                      <button
                        onClick={() =>
                          handleInquiryStatusChange(inquiry.id, "contacted")
                        }
                        className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        対応済み
                      </button>
                    )}
                    {inquiry.status !== "closed" && (
                      <button
                        onClick={() =>
                          handleInquiryStatusChange(inquiry.id, "closed")
                        }
                        className="rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                      >
                        クローズ
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInquiry(inquiry.id)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionCalendar
        sectionId={id}
        reservations={section.reservations}
        onDataChange={fetchSection}
      />
    </div>
  );
}
