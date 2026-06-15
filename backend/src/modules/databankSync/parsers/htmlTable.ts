import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { repairUtf8Mojibake } from "../encoding.js";
import {
  parseDatabankDate,
  parseTurkishDecimal,
  parseTurkishInteger,
  parseVolumeCell,
} from "../normalize.js";
import type { HomeTableRow, TescilBulletinRow } from "../types.js";

function cellText($: cheerio.CheerioAPI, el: Element): string {
  return repairUtf8Mojibake($(el).text().replace(/\u00a0/g, " ").trim());
}

export function parseHomeTableHtml(
  html: string,
  defaultCategory = "GENEL",
): HomeTableRow[] {
  const $ = cheerio.load(html);
  const rows: HomeTableRow[] = [];
  let category = defaultCategory;

  $("tr").each((_, tr) => {
    const $tr = $(tr);
    const mg = $tr.find("td.mg").first();
    if (mg.length) {
      category = cellText($, mg[0]!);
      return;
    }
    if (!$tr.hasClass("bline")) return;

    const tds = $tr.find("td").toArray();
    if (tds.length < 9) return;

    const productName = cellText($, tds[0]!);
    const saleType = cellText($, tds[1]!);
    const lastTradeDate = cellText($, tds[2]!);
    if (!productName || !saleType) return;

    rows.push({
      productName,
      saleType,
      lastTradeDate,
      category,
      buy: {
        low: parseTurkishDecimal(cellText($, tds[3]!)),
        high: parseTurkishDecimal(cellText($, tds[4]!)),
        avg: parseTurkishDecimal(cellText($, tds[5]!)),
      },
      sell: {
        low: parseTurkishDecimal(cellText($, tds[6]!)),
        high: parseTurkishDecimal(cellText($, tds[7]!)),
        avg: parseTurkishDecimal(cellText($, tds[8]!)),
      },
    });
  });

  return rows;
}

export function parseTescilBulletinHtml(
  html: string,
  defaultCategory = "GENEL",
): TescilBulletinRow[] {
  const $ = cheerio.load(html);
  const rows: TescilBulletinRow[] = [];
  let category = defaultCategory;

  $("tr").each((_, tr) => {
    const $tr = $(tr);
    const mg = $tr.find("td.mg").first();
    if (mg.length) {
      category = cellText($, mg[0]!);
      return;
    }
    if (!$tr.hasClass("bline")) return;

    const tds = $tr.find("td").toArray();
    if (tds.length < 8) return;

    const productName = cellText($, tds[0]!);
    const low = parseTurkishDecimal(cellText($, tds[1]!));
    const high = parseTurkishDecimal(cellText($, tds[2]!));
    const avg = parseTurkishDecimal(cellText($, tds[3]!));
    const volRaw = cellText($, tds[4]!);
    const transactionAmount = parseTurkishDecimal(cellText($, tds[5]!));
    const saleType = cellText($, tds[6]!);
    const transactionCount = parseTurkishInteger(cellText($, tds[7]!));
    if (!productName || !low || !high || !avg || !saleType) return;

    const { volume, volumeUnit } = parseVolumeCell(volRaw);

    rows.push({
      productName,
      saleType,
      low,
      high,
      avg,
      volume,
      volumeUnit,
      transactionAmount,
      transactionCount,
      category,
    });
  });

  return rows;
}

export function countBlineRows(html: string): number {
  const $ = cheerio.load(html);
  return $("tr.bline").length;
}

export function validateHomeRowDates(rows: HomeTableRow[]): number {
  return rows.filter((r) => parseDatabankDate(r.lastTradeDate)).length;
}
