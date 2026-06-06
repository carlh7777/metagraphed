import { spawnSync } from "node:child_process";
import path from "node:path";
import { readJson, repoRoot, stableStringify } from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const manifest = await readJson(path.join(repoRoot, "public/metagraph/r2-manifest.json"));
const freshness = await readJson(path.join(repoRoot, "public/metagraph/freshness.json"));

const pointer = {
  contract_version: manifest.contract_version,
  generated_at: manifest.generated_at,
  latest_prefix: manifest.latest_prefix,
  run_prefix: manifest.run_prefix,
  artifact_count: manifest.artifact_count,
  native_snapshot_captured_at: freshness.summary.native_snapshot_captured_at,
  health_surface_count: freshness.summary.health_surface_count
};

if (!write) {
  console.log(stableStringify({
    mode: "dry-run",
    key: "metagraph:latest",
    value: pointer
  }));
  process.exit(0);
}

if (!process.env.METAGRAPH_KV_NAMESPACE_ID) {
  console.error("METAGRAPH_KV_NAMESPACE_ID is required to publish the latest pointer.");
  process.exit(1);
}
if (process.env.METAGRAPH_ALLOW_KV_WRITE !== "1") {
  console.error("Refusing to write KV without METAGRAPH_ALLOW_KV_WRITE=1.");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "--yes",
    "wrangler",
    "kv",
    "key",
    "put",
    "metagraph:latest",
    JSON.stringify(pointer),
    "--namespace-id",
    process.env.METAGRAPH_KV_NAMESPACE_ID
  ],
  {
    encoding: "utf8",
    stdio: "pipe"
  }
);

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status || 1);
}

console.log("Published metagraph:latest KV pointer.");
