import prisma from "../prisma";
import type {
  Facility,
  Section,
  Inquiry,
  Reservation,
  BlockedDate,
} from "@prisma/client";

export type { Facility, Section, Inquiry, Reservation, BlockedDate };

export interface SectionWithInquiries extends Section {
  inquiries: Inquiry[];
}

export interface SectionWithRelations extends Section {
  inquiries: Inquiry[];
  reservations: Reservation[];
}

export interface FacilityWithSections extends Facility {
  sections: Section[];
}

// --- Facility ---

export async function getFacility(): Promise<FacilityWithSections | null> {
  return prisma.facility.findFirst({
    include: { sections: { orderBy: { name: "asc" } } },
  });
}

// --- Section ---

export async function getAllSections(): Promise<Section[]> {
  return prisma.section.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getActiveSections(): Promise<Section[]> {
  return prisma.section.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
  });
}

export async function getSectionById(
  id: string
): Promise<SectionWithRelations | null> {
  return prisma.section.findUnique({
    where: { id },
    include: {
      inquiries: { orderBy: { createdAt: "desc" } },
      reservations: { orderBy: { startDate: "asc" } },
    },
  });
}

export async function getSectionByName(name: string): Promise<Section | null> {
  let section = await prisma.section.findFirst({
    where: { name },
  });

  if (!section) {
    section = await prisma.section.findFirst({
      where: {
        name: {
          contains: name,
        },
      },
    });
  }

  return section;
}

export async function getSectionsByCategory(
  category: string
): Promise<Section[]> {
  return prisma.section.findMany({
    where: { category },
    orderBy: { name: "asc" },
  });
}

export async function createSection(data: {
  facilityId: string;
  name: string;
  floor: number;
  area: number;
  rentPrice: number;
  category: string;
  status?: string;
  features: string[];
  description?: string;
}): Promise<Section> {
  return prisma.section.create({
    data: {
      facilityId: data.facilityId,
      name: data.name,
      floor: data.floor,
      area: data.area,
      rentPrice: data.rentPrice,
      category: data.category,
      status: data.status || "active",
      features: JSON.stringify(data.features),
      description: data.description || "",
    },
  });
}

export async function updateSection(
  id: string,
  data: {
    name?: string;
    floor?: number;
    area?: number;
    rentPrice?: number;
    category?: string;
    status?: string;
    features?: string[];
    description?: string;
  }
): Promise<Section> {
  const { features, ...rest } = data;
  return prisma.section.update({
    where: { id },
    data: {
      ...rest,
      features: features ? JSON.stringify(features) : undefined,
    },
  });
}

export async function deleteSection(id: string): Promise<void> {
  await prisma.section.delete({
    where: { id },
  });
}

// --- Inquiry ---

export async function getInquiriesBySection(
  sectionId: string
): Promise<Inquiry[]> {
  return prisma.inquiry.findMany({
    where: { sectionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInquiry(data: {
  sectionId: string;
  callerName: string;
  callerPhone: string;
  inquiryType: string;
  message: string;
}): Promise<Inquiry> {
  return prisma.inquiry.create({
    data,
  });
}

export async function updateInquiry(
  id: string,
  data: { status?: string }
): Promise<Inquiry> {
  return prisma.inquiry.update({
    where: { id },
    data,
  });
}

export async function deleteInquiry(id: string): Promise<void> {
  await prisma.inquiry.delete({
    where: { id },
  });
}

// --- Reservation ---

export async function getReservationsBySection(
  sectionId: string,
  from: Date,
  to: Date
): Promise<Reservation[]> {
  return prisma.reservation.findMany({
    where: {
      sectionId,
      startDate: { lte: to },
      endDate: { gte: from },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function isSectionAvailable(
  sectionId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const overlapping = await prisma.reservation.findFirst({
    where: {
      sectionId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  return overlapping === null;
}

export async function createReservation(data: {
  sectionId: string;
  startDate: Date;
  endDate: Date;
  tenantName: string;
  purpose: string;
  note?: string;
}): Promise<Reservation> {
  return prisma.reservation.create({
    data: {
      sectionId: data.sectionId,
      startDate: data.startDate,
      endDate: data.endDate,
      tenantName: data.tenantName,
      purpose: data.purpose,
      note: data.note || "",
    },
  });
}

export async function deleteReservation(id: string): Promise<void> {
  await prisma.reservation.delete({
    where: { id },
  });
}

// --- BlockedDate ---

export async function getBlockedDatesBySection(
  sectionId: string,
  from: Date,
  to: Date
): Promise<BlockedDate[]> {
  return prisma.blockedDate.findMany({
    where: {
      sectionId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
  });
}

export async function toggleBlockedDate(
  sectionId: string,
  date: Date,
  reason?: string
): Promise<{ action: "created" | "deleted"; blockedDate?: BlockedDate }> {
  const existing = await prisma.blockedDate.findUnique({
    where: { sectionId_date: { sectionId, date } },
  });

  if (existing) {
    await prisma.blockedDate.delete({ where: { id: existing.id } });
    return { action: "deleted" };
  }

  const blockedDate = await prisma.blockedDate.create({
    data: { sectionId, date, reason: reason || "" },
  });
  return { action: "created", blockedDate };
}

// --- Helpers ---

export function parseFeatures(section: Section): string[] {
  try {
    return JSON.parse(section.features);
  } catch {
    return [];
  }
}

export function formatRentPrice(price: number): string {
  return `${price.toLocaleString()}円/日`;
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "利用可能";
    case "inactive":
      return "利用停止中";
    default:
      return status;
  }
}

export function getCategoryLabel(category: string): string {
  return category; // already in Japanese
}
