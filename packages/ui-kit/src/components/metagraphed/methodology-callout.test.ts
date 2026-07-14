import { describe, expect, it } from "vitest";
import { STAKING_RISK_COPY } from "./methodology-callout";

describe("STAKING_RISK_COPY", () => {
  it("frames root as no principal risk and TAO-denominated", () => {
    expect(STAKING_RISK_COPY.root.short.toLowerCase()).toContain(
      "no principal risk",
    );
    expect(STAKING_RISK_COPY.root.short.toLowerCase()).toContain(
      "tao-denominated",
    );
    expect(STAKING_RISK_COPY.root.long.toLowerCase()).toContain("netuid 0");
  });

  it("frames alpha as price-exposed with possible TAO net-loss", () => {
    expect(STAKING_RISK_COPY.alpha.short.toLowerCase()).toContain(
      "price-exposed",
    );
    expect(STAKING_RISK_COPY.alpha.long.toLowerCase()).toContain("net-lose");
    expect(STAKING_RISK_COPY.alpha.long.toLowerCase()).toMatch(/nominal apy/);
  });

  it("states yield figures are trailing windows, not forecasts", () => {
    expect(STAKING_RISK_COPY.windows.short.toLowerCase()).toContain(
      "trailing window",
    );
    expect(STAKING_RISK_COPY.windows.short.toLowerCase()).toContain(
      "not a forecast",
    );
    expect(STAKING_RISK_COPY.windows.long.toLowerCase()).not.toContain(
      "projection of future",
    );
  });
});
