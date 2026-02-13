import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 既存のデータを削除
  await prisma.reservation.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.section.deleteMany();
  await prisma.facility.deleteMany();

  // 施設を作成: つくにんモール渋谷
  const facility = await prisma.facility.create({
    data: {
      name: "つくにんモール渋谷",
      address: "東京都渋谷区神南1-2-3",
      phone: "03-1234-5678",
      hours: "10:00〜21:00",
    },
  });

  // 区画を作成 (全11区画) — 日額料金、status: active/inactive
  const sections = await Promise.all([
    // 1F: 物販・飲食 4区画
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "1F-A",
        floor: 1,
        area: 45,
        rentPrice: 15000,
        category: "物販",
        status: "active",
        features: JSON.stringify(["角地", "大通り面", "搬入口あり"]),
        description: "大通りに面した角地の好立地区画。搬入口も完備しており、ポップアップストアや期間限定ショップに最適です。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "1F-B",
        floor: 1,
        area: 60,
        rentPrice: 18000,
        category: "飲食",
        status: "active",
        features: JSON.stringify(["厨房設備", "排気ダクト", "グリストラップ"]),
        description: "厨房設備・排気ダクト完備の飲食向け区画。フードイベントやカフェの催事出店に対応できます。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "1F-C",
        floor: 1,
        area: 35,
        rentPrice: 12000,
        category: "物販",
        status: "active",
        features: JSON.stringify(["エントランス横", "ショーウィンドウ"]),
        description: "エントランス横の視認性の高い区画。ショーウィンドウ付きで、コスメやアクセサリーのポップアップに最適です。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "1F-D",
        floor: 1,
        area: 80,
        rentPrice: 27000,
        category: "飲食",
        status: "active",
        features: JSON.stringify([
          "厨房設備",
          "テラス席可",
          "排気ダクト",
          "大通り面",
        ]),
        description: "テラス席対応の広々とした飲食区画。大通りに面しており、フードフェスや大型催事の出店に適しています。",
      },
    }),

    // 2F: 物販・サービス 4区画
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "2F-A",
        floor: 2,
        area: 50,
        rentPrice: 11000,
        category: "物販",
        status: "active",
        features: JSON.stringify(["エスカレーター横", "柱なし"]),
        description: "エスカレーター横の集客力のある区画。柱なしの開放的な空間で、アパレルや雑貨の展示販売に向いています。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "2F-B",
        floor: 2,
        area: 40,
        rentPrice: 10000,
        category: "サービス",
        status: "active",
        features: JSON.stringify(["個室区画可", "水回りあり"]),
        description: "水回り完備のサービス向け区画。ネイルサロンやマッサージなど、美容・リラクゼーション系の催事出店に最適です。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "2F-C",
        floor: 2,
        area: 30,
        rentPrice: 8000,
        category: "サービス",
        status: "active",
        features: JSON.stringify(["静音区画", "個室区画可"]),
        description: "静音設計の個室対応区画。カウンセリングや占い、ワークショップなど落ち着いた空間が必要な用途に適しています。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "2F-D",
        floor: 2,
        area: 55,
        rentPrice: 12000,
        category: "物販",
        status: "inactive",
        features: JSON.stringify(["角地", "柱なし", "エレベーター横"]),
        description: "角地でエレベーター横の好アクセス区画。現在改装中のため一時利用停止中です。再開時期はお問い合わせください。",
      },
    }),

    // 3F: オフィス・サービス 3区画
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "3F-A",
        floor: 3,
        area: 120,
        rentPrice: 20000,
        category: "オフィス",
        status: "active",
        features: JSON.stringify(["窓あり", "会議室付き", "OAフロア"]),
        description: "会議室付きの大型オフィス区画。OAフロア・窓ありで、展示会やセミナー会場としても利用可能です。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "3F-B",
        floor: 3,
        area: 80,
        rentPrice: 15000,
        category: "オフィス",
        status: "active",
        features: JSON.stringify(["窓あり", "OAフロア"]),
        description: "自然光が入る明るいオフィス区画。コワーキングスペースや企業の短期プロジェクトルームとしておすすめです。",
      },
    }),
    prisma.section.create({
      data: {
        facilityId: facility.id,
        name: "3F-C",
        floor: 3,
        area: 15,
        rentPrice: 6000,
        category: "サービス",
        status: "active",
        features: JSON.stringify(["個室", "防音"]),
        description: "防音仕様のコンパクト個室。音楽レッスンや収録スタジオ、オンライン配信ブースとしてご利用いただけます。",
      },
    }),
  ]);

  // サンプル問い合わせを作成
  await prisma.inquiry.createMany({
    data: [
      {
        sectionId: sections[2].id, // 1F-C
        callerName: "田中太郎",
        callerPhone: "090-1234-5678",
        inquiryType: "内見希望",
        message:
          "ポップアップストアの出店を検討しています。来週内見は可能でしょうか。",
        status: "new",
      },
      {
        sectionId: sections[3].id, // 1F-D
        callerName: "鈴木花子",
        callerPhone: "080-9876-5432",
        inquiryType: "条件確認",
        message:
          "フードフェスの催事出店を考えています。テラス席の広さと排気設備について詳しく知りたいです。",
        status: "new",
      },
      {
        sectionId: sections[8].id, // 3F-A
        callerName: "佐藤一郎",
        callerPhone: "03-5555-1234",
        inquiryType: "条件確認",
        message:
          "展示会スペースとして1週間利用したいです。料金の相談は可能でしょうか。",
        status: "contacted",
      },
    ],
  });

  // サンプル予約を作成（5件）
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  await prisma.reservation.createMany({
    data: [
      {
        sectionId: sections[0].id, // 1F-A
        startDate: new Date(year, month, 5),
        endDate: new Date(year, month, 11),
        tenantName: "ABC アパレル",
        purpose: "ポップアップストア",
        note: "春物コレクション展示販売",
      },
      {
        sectionId: sections[0].id, // 1F-A
        startDate: new Date(year, month, 20),
        endDate: new Date(year, month, 25),
        tenantName: "デザインスタジオK",
        purpose: "展示会",
        note: "新作プロダクト発表",
      },
      {
        sectionId: sections[1].id, // 1F-B
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month, 14),
        tenantName: "博多屋台フーズ",
        purpose: "催事",
        note: "博多グルメフェア",
      },
      {
        sectionId: sections[2].id, // 1F-C
        startDate: new Date(year, month + 1, 1),
        endDate: new Date(year, month + 1, 7),
        tenantName: "コスメブランドN",
        purpose: "ポップアップストア",
        note: "新商品体験イベント",
      },
      {
        sectionId: sections[8].id, // 3F-A
        startDate: new Date(year, month, 10),
        endDate: new Date(year, month, 12),
        tenantName: "テックスタートアップ合同会社",
        purpose: "展示会",
        note: "AI技術展示デモ",
      },
    ],
  });

  console.log("Seed data created successfully!");
  console.log(
    `Created 1 facility, ${sections.length} sections, 3 inquiries, and 5 reservations`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
