import Link from "next/link";
import { getAllSections } from "@/lib/data/sections";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sections = await getAllSections();
  const vacantCount = sections.filter((s) => s.status === "vacant").length;
  const newInquiryCount = await prisma.inquiry.count({
    where: { status: "new" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        ダッシュボード
      </h1>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            全区画数
          </h2>
          <p className="mt-2 text-4xl font-bold text-blue-600">
            {sections.length}
          </p>
          <Link
            href="/admin/sections"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            区画一覧へ →
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            空き区画
          </h2>
          <p className="mt-2 text-4xl font-bold text-green-600">
            {vacantCount}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            新規問い合わせ
          </h2>
          <p className="mt-2 text-4xl font-bold text-orange-600">
            {newInquiryCount}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          クイックアクション
        </h2>
        <div className="mt-4 flex gap-4">
          <Link
            href="/admin/sections"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            区画を管理
          </Link>
        </div>
      </div>
    </div>
  );
}
