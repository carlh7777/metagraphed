import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { handleRequest } from "../workers/api.mjs";
import { repoRoot } from "./lib.mjs";

const env = {
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      const filePath = path.join(repoRoot, "public", url.pathname.replace(/^\/+/, ""));
      try {
        const body = await fs.readFile(filePath);
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": filePath.endsWith(".json") ? "application/json" : "application/octet-stream"
          }
        });
      } catch {
        return new Response("not found", { status: 404 });
      }
    }
  }
};

const checks = [
  ["/api/v1/subnets", (body) => assert.equal(Array.isArray(body.data.subnets), true)],
  ["/api/v1/subnets/7", (body) => assert.equal(body.data.subnet.netuid, 7)],
  ["/api/v1/surfaces?kind=openapi", (body) => assert.equal(body.data.surfaces.every((surface) => surface.kind === "openapi"), true)],
  ["/api/v1/providers", (body) => assert.equal(Array.isArray(body.data.providers), true)],
  ["/api/v1/health", (body) => assert.equal(Array.isArray(body.data.subnets), true)],
  ["/api/v1/rpc/endpoints", (body) => assert.equal(Array.isArray(body.data.endpoints), true)],
  ["/api/v1/rpc/pools", (body) => assert.equal(Array.isArray(body.data.pools), true)],
  ["/api/v1/schemas", (body) => assert.equal(Array.isArray(body.data.schemas), true)],
  ["/api/v1/adapters/allways", (body) => assert.equal(body.data.slug, "allways")],
  ["/api/v1/search?q=allways", (body) => assert.equal(body.data.documents.length > 0, true)]
];

for (const [route, assertion] of checks) {
  const response = await handleRequest(new Request(`https://metagraph.sh${route}`), env, {});
  assert.equal(response.status, 200, `${route}: expected 200`);
  assert.equal(response.headers.get("access-control-allow-origin"), "*", `${route}: missing CORS`);
  assert.ok(response.headers.get("etag"), `${route}: missing ETag`);
  assert.equal(response.headers.get("x-metagraph-contract-version"), "2026-06-06.1", `${route}: missing contract header`);
  const body = await response.json();
  assert.equal(body.ok, true, `${route}: expected ok envelope`);
  assert.equal(body.schema_version, 1, `${route}: expected schema_version 1`);
  assertion(body);
}

const missing = await handleRequest(new Request("https://metagraph.sh/api/v1/subnets/9999"), env, {});
assert.equal(missing.status, 404, "missing subnet should return 404");
assert.equal((await missing.json()).ok, false, "missing subnet should return error envelope");

const proxy = await handleRequest(new Request("https://metagraph.sh/rpc/v1/finney", { method: "POST" }), env, {});
assert.equal(proxy.status, 405, "non-GET proxy request should be rejected before proxy handling");

console.log(`Validated ${checks.length} Worker API route(s).`);
