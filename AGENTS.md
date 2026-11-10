# SodaDEX V2/V3 source distribution

Keep upstream source trees and all copyright/license notices unchanged. Put SodaDEX
changes in `sodadex/`; retain the original SPDX license on derived files. Exclude
V4/SodaFlow/IGNIX code, secrets, frontend/backend code and wallet configuration.
Use `npm ci --ignore-scripts`, `npm run build`, then `npm test`. The integration
runner may only use its own loopback Anvil on chain 31337 and must tear it down.
Deployment records are historical facts, not permission to sign or broadcast.
Keep 196 formal V2/V3 addresses unchanged; new test deployments need separate records.
