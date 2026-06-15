import type { FastifyReply } from "fastify";
import type { Config } from "../../config.js";
import type { Database } from "../../db/connection.js";
import { sendPdfFromStorage } from "../../lib/sendPdfFile.js";
import { getPublishedReportFile } from "./reports.public.service.js";

export async function sendReportPdfDownload(
  db: Database,
  config: Config,
  slug: string,
  reply: FastifyReply,
  options?: { inline?: boolean },
): Promise<FastifyReply> {
  const file = await getPublishedReportFile(db, slug);
  if (!file) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Rapor bulunamadı." },
    });
  }

  return sendPdfFromStorage(config, reply, file, { inline: options?.inline });
}
