import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTruncgilFinancePayload } from "./marketTicker.service.js";

describe("parseTruncgilFinancePayload", () => {
  it("maps BIST, FX and gold", () => {
    const items = parseTruncgilFinancePayload({
      Rates: {
        XU100: { Selling: 14067.5, Change: 2.36 },
        USD: { Selling: 46.2702, Change: 0.14 },
        EUR: { Selling: 53.615, Change: -0.07 },
        GRA: { Selling: 6262.68, Change: 0.08 },
      },
    });

    assert.equal(items.length, 4);
    assert.equal(items[0]?.code, "BIST100");
    assert.equal(items[0]?.label, "BIST 100");
    assert.equal(items[1]?.code, "USDTRY");
    assert.equal(items[3]?.code, "ALTIN");
    assert.equal(items[3]?.direction, 1);
  });
});
