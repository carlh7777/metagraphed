import { spawnSync } from "node:child_process";
import path from "node:path";
import { readJson, repoRoot, stableStringify } from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const manifest = await readJson(path.join(repoRoot, "public/metagraph/r2-manifest.json"));

if (!write) {
  console.log(stableStringify({
    mode: "dry-run",
    artifact_count: manifest.artifact_count,
    bucket_name: manifest.bucket_name,
    latest_prefix: manifest.latest_prefix,
    run_prefix: manifest.run_prefix
  }));
  process.exit(0);
}

if (process.env.METAGRAPH_ALLOW_R2_UPLOAD !== "1") {
  console.error("Refusing to upload to R2 without METAGRAPH_ALLOW_R2_UPLOAD=1.");
  process.exit(1);
}

for (const artifact of manifest.artifacts) {
  const localPath = path.join(repoRoot, "public/metagraph", artifact.path.replace(/^\/metagraph\//, ""));
  putObject(localPath, artifact.key, manifest.bucket_name);
  putObject(localPath, artifact.latest_key, manifest.bucket_name);
}

console.log(`Uploaded ${manifest.artifact_count} artifact(s) to R2 bucket ${manifest.bucket_name}.`);

function putObject(localPath, key, bucketName) {
  const result = spawnSync(
    "npx",
    ["--yes", "wrangler", "r2", "object", "put", `${bucketName}/${key}`, "--file", localPath],
    {
      encoding: "utf8",
      stdio: "pipe"
    }
  );
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`wrangler r2 object put failed for ${key}`);
  }
}
