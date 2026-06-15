import { and, gt, isNotNull, isNull, or, type SQL } from "drizzle-orm";
import { announcements } from "../../db/schema/index.js";

/** Published, not soft-deleted, and not past expiresAt (if set). */
export function activeAnnouncementWhere(now: Date = new Date()): SQL {
  const cond = and(
    isNull(announcements.deletedAt),
    isNotNull(announcements.publishedAt),
    or(
      isNull(announcements.expiresAt),
      gt(announcements.expiresAt, now),
    ),
  );
  if (!cond) {
    throw new Error("activeAnnouncementWhere: empty condition");
  }
  return cond;
}
