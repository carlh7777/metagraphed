# Cloudflare Backend

Metagraphed uses Cloudflare as the serving, cache, and artifact-history layer. GitHub-reviewed registry inputs and generated JSON remain canonical.

## Runtime Shape

- Workers serve `metagraph.sh/api/v1/*` routes over canonical `/metagraph/*` artifacts.
- Workers Static Assets serve the checked-in `public/metagraph` artifact tree.
- R2 stores versioned artifact history under `runs/{generated_at}/` and current copies under `latest/`.
- KV stores small latest pointers and feature flags when configured.
- D1 is not used for canonical registry truth in v1.
- The read-only RPC proxy/load-balancer contract exists in artifacts, but proxying is disabled by default.

## Worker Routes

- `/api/v1/subnets`
- `/api/v1/subnets/{netuid}`
- `/api/v1/surfaces`
- `/api/v1/providers`
- `/api/v1/health`
- `/api/v1/rpc/endpoints`
- `/api/v1/rpc/pools`
- `/api/v1/schemas`
- `/api/v1/adapters/{slug}`
- `/api/v1/search`

All API responses use a stable JSON envelope with `ok`, `schema_version`, `data`, `meta`, and `error` fields.

## Cloudflare Resources

- Worker name: `metagraphed`
- R2 bucket: `metagraphed-artifacts`
- R2 binding: `METAGRAPH_ARCHIVE`
- Static assets binding: `ASSETS`
- Optional KV latest pointer key: `metagraph:latest`

## Local Commands

- `npm run validate:api`: validate Worker API routes against local artifacts.
- `npm run worker:deploy:dry-run`: validate `wrangler.jsonc` and Worker entrypoint shape.
- `npm run r2:manifest`: regenerate the R2 upload manifest from `public/metagraph`.
- `npm run r2:manifest:dry-run`: validate and summarize the current manifest.
- `npm run r2:upload:dry-run`: summarize the upload without writing to Cloudflare.
- `npm run kv:publish:dry-run`: summarize the KV latest pointer without writing to Cloudflare.

Write operations require explicit environment flags:

- `METAGRAPH_ALLOW_R2_UPLOAD=1 npm run r2:upload`
- `METAGRAPH_ALLOW_KV_WRITE=1 METAGRAPH_KV_NAMESPACE_ID=... npm run kv:publish`

## Safety Boundary

Owned Bittensor lite/archive nodes are not part of this backend yet. Public endpoint pools only score and describe public endpoints. Any future proxy must keep write and unsafe RPC methods blocked by default.
