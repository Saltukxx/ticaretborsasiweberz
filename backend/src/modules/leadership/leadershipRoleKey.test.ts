import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRoleKeyBase,
  withRoleKeySuffix,
} from "./leadershipRoleKey.js";

describe("buildRoleKeyBase", () => {
  it("builds meclis slug from Turkish name", () => {
    assert.equal(
      buildRoleKeyBase("meclis", "Ahmet YILMAZ"),
      "meclis_ahmet_yilmaz",
    );
  });

  it("strips honorific prefix", () => {
    assert.equal(
      buildRoleKeyBase("danisman", "Prof. Dr. Ensar AĞIRMAN"),
      "danisman_ensar_agirman",
    );
  });

  it("uses yk prefix for yonetim kurulu", () => {
    assert.equal(
      buildRoleKeyBase("yonetim_kurulu", "Turhan DİNLER"),
      "yk_turhan_dinler",
    );
  });
});

describe("withRoleKeySuffix", () => {
  it("returns base for n=1", () => {
    assert.equal(withRoleKeySuffix("meclis_ali_lac", 1), "meclis_ali_lac");
  });

  it("appends numeric suffix for collisions", () => {
    assert.equal(withRoleKeySuffix("meclis_ali_lac", 2), "meclis_ali_lac_2");
  });
});
