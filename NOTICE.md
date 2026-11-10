# Copyright and license notices

This repository contains software derived from Uniswap V2 and Uniswap V3. Original copyright holders and contributors retain their rights. All upstream source headers, SPDX identifiers, license files, and attribution have been preserved in their respective directories. SodaDEX is an independent project, not an official Uniswap deployment or endorsement.

- Uniswap V2 core/periphery: retain the supplied GPL-3.0 / GPL-3.0-or-later terms as indicated by each source/package.
- Uniswap V3 core: this pinned historical release originally used BUSL-1.1, with conversion to GPL-2.0-or-later on its applicable Change Date (2023-04-01). The original BUSL and additional per-directory GPL/MIT texts are retained without rewriting historical notices. See https://support.uniswap.org/hc/en-us/articles/14569783029645-Uniswap-v3-licensing and `upstream/v3-core/LICENSE`.
- Uniswap V3 periphery and SodaDEX changes to its GPL sources: GPL-2.0-or-later as specified in those files. MIT helper sources retain their MIT SPDX notices. A GPL-compatible helper license does not relicense the surrounding GPL-derived work.
- Dependencies: see their original license and copyright files under `vendor/` and the upstream trees. The root GPL-3.0 text does not override a source file's permitted license choices.

The packaged work may be redistributed under the compatible GPL terms, preserving the applicable individual notices. Do not remove upstream attribution, impose a non-commercial restriction on the GPL-covered code, or represent that these licenses grant trademarks. Source and the scripts needed to build the packaged variants are provided together.

SodaDEX modifications are kept separately under `sodadex/` and identified in the source comments. Packaging, regression tests, and deployment documentation added on 2026-11-09 are marked as SodaDEX modifications. No ownership of unmodified Uniswap or third-party code is claimed.
