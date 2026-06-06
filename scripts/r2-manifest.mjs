import path from "node:path";
import { stat } from "node:fs/promises";
import { buildTimestamp, listJsonFilesRecursive, readJson, repoRoot, stableStringify, writeJson } from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const manifestPath = path.join(repoRoot, "public/metagraph/r2-manifest.json");
const manifest = write ? await buildManifest() : await readJson(manifestPath);

const summary = {
  artifact_count: manifest.artifact_count,
  artifact_size_bytes: manifest.artifact_size_bytes,
  bucket_binding: manifest.bucket_binding,
  bucket_name: manifest.bucket_name,
  latest_prefix: manifest.latest_prefix,
  run_prefix: manifest.run_prefix
};

if (write) {
  await writeJson(manifestPath, manifest);
}

for (const artifact of manifest.artifacts) {
  if (!artifact.key || !artifact.latest_key || !artifact.path || !Number.isInteger(artifact.size_bytes)) {
    console.error(`Invalid R2 manifest artifact entry: ${stableStringify(artifact)}`);
    process.exit(1);
  }
}

console.log(stableStringify(summary));

async function buildManifest() {
  const generatedAt = buildTimestamp();
  const version = generatedAt.replace(/[:.]/g, "-");
  const files = await listJsonFilesRecursive(path.join(repoRoot, "public/metagraph"));
  const artifacts = [];
  for (const file of files) {
    const relative = path.relative(path.join(repoRoot, "public/metagraph"), file).replace(/\\/g, "/");
    if (["build-summary.json", "r2-manifest.json"].includes(relative)) {
      continue;
    }
    const fileStat = await stat(file);
    artifacts.push({
      content_type: "application/json",
      key: `runs/${version}/${relative}`,
      latest_key: `latest/${relative}`,
      path: `/metagraph/${relative}`,
      size_bytes: fileStat.size
    });
  }
  artifacts.sort((a, b) => a.path.localeCompare(b.path));
  return {
    schema_version: 1,
    contract_version: "2026-06-06.1",
    generated_at: generatedAt,
    bucket_binding: "METAGRAPH_ARCHIVE",
    bucket_name: "metagraphed-artifacts",
    latest_prefix: "latest/",
    run_prefix: `runs/${version}/`,
    artifact_count: artifacts.length,
    artifact_size_bytes: artifacts.reduce((sum, artifact) => sum + artifact.size_bytes, 0),
    artifacts
  };
}
