export type AnnouncementStatusRow = {
  publishedAt: string | null;
  expiresAt: string | null;
  deletedAt: string | null;
};

export function getAnnouncementStatus(row: AnnouncementStatusRow): {
  label: string;
  className: string;
} {
  if (row.deletedAt) {
    return { label: "silindi", className: "" };
  }
  if (!row.publishedAt) {
    return { label: "taslak", className: "" };
  }
  if (row.expiresAt && new Date(row.expiresAt) <= new Date()) {
    return { label: "süresi doldu", className: "bg-amber-600 hover:bg-amber-600" };
  }
  return { label: "yayında", className: "bg-emerald-600 hover:bg-emerald-600" };
}

export function isAnnouncementPubliclyVisible(row: AnnouncementStatusRow): boolean {
  if (row.deletedAt || !row.publishedAt) return false;
  if (row.expiresAt && new Date(row.expiresAt) <= new Date()) return false;
  return true;
}
