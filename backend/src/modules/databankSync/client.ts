import { decodeHtmlBuffer } from "./encoding.js";

export type DatabankClientOptions = {
  baseUrl: string;
  requestDelayMs: number;
  userAgent?: string;
};

export class DatabankClient {
  private readonly baseUrl: string;
  private readonly delayMs: number;
  private readonly userAgent: string;
  private lastRequestAt = 0;

  constructor(opts: DatabankClientOptions) {
    this.baseUrl = opts.baseUrl.endsWith("/")
      ? opts.baseUrl
      : `${opts.baseUrl}/`;
    this.delayMs = opts.requestDelayMs;
    this.userAgent =
      opts.userAgent ??
      "ETB-DatabankSync/1.0 (+https://erzurumtb.org.tr)";
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const wait = this.delayMs - (now - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  private url(path: string, query?: Record<string, string>): string {
    const u = new URL(path.replace(/^\.\//, ""), this.baseUrl);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        u.searchParams.set(k, v);
      }
    }
    return u.toString();
  }

  async fetchHtml(
    path: string,
    init?: { method?: string; body?: URLSearchParams; query?: Record<string, string> },
  ): Promise<string> {
    await this.throttle();
    const method = init?.method ?? "GET";
    const res = await fetch(this.url(path, init?.query), {
      method,
      headers: {
        "User-Agent": this.userAgent,
        Accept: "text/html,application/xhtml+xml",
        ...(method === "POST"
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
      },
      body: init?.body?.toString(),
    });
    if (!res.ok) {
      throw new Error(
        `DataBank HTTP ${res.status} for ${path} (${method})`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return decodeHtmlBuffer(buf, res.headers.get("content-type"));
  }

  async fetchHomeTable(year: string, group: string): Promise<string> {
    const body = new URLSearchParams({
      HOMEYEAR: year,
      HOMEGROUP: group,
      HOMELANG: "TR",
    });
    return this.fetchHtml("default.aspx", { method: "POST", body });
  }

  async fetchTescilBulletin(
    capno: string,
    bdate: string,
    edate?: string,
  ): Promise<string> {
    const body = new URLSearchParams({
      CAPNO: capno,
      BDATE: bdate,
      EDATE: edate ?? bdate,
      LANG: "TR",
    });
    return this.fetchHtml("./", {
      method: "POST",
      body,
      query: { lno: "2" },
    });
  }

  /** Yıllık tescil bülteni (CAPNO=Y). */
  async fetchTescilBulletinYearly(year: string): Promise<string> {
    const body = new URLSearchParams({
      CAPNO: "Y",
      YEA: year,
      BDATE: `${year}-01-01`,
      EDATE: `${year}-12-31`,
      LANG: "TR",
    });
    return this.fetchHtml("./", {
      method: "POST",
      body,
      query: { lno: "2" },
    });
  }

  /** Aylık tescil bülteni (CAPNO=M). `monKey` örn. `2026.Mayıs`. */
  async fetchTescilBulletinMonthly(monKey: string): Promise<string> {
    const body = new URLSearchParams({
      CAPNO: "M",
      MON: monKey,
      BDATE: "2000-01-01",
      EDATE: "2099-12-31",
      LANG: "TR",
    });
    return this.fetchHtml("./", {
      method: "POST",
      body,
      query: { lno: "2" },
    });
  }

  async fetchProductChart(params: {
    mname: string;
    itemsIslem: "1" | "2";
    itemsPer: "1" | "2" | "3";
    bdate: string;
    edate: string;
  }): Promise<string> {
    const body = new URLSearchParams({
      MNAME: params.mname,
      ITEMSISLEM: params.itemsIslem,
      ITEMSPER: params.itemsPer,
      BDATE: params.bdate,
      EDATE: params.edate,
    });
    return this.fetchHtml("./", {
      method: "POST",
      body,
      query: { lno: "3" },
    });
  }

  async fetchProductCatalogPage(): Promise<string> {
    return this.fetchHtml("./", { query: { lno: "3" } });
  }

  async fetchVolumeYear(year: string): Promise<string> {
    const body = new URLSearchParams({ VOLUMEMONTHYEARS: year });
    return this.fetchHtml("./", {
      method: "POST",
      body,
      query: { lno: "4" },
    });
  }
}
