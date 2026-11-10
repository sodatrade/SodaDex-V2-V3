# SodaDEX V2 / V3 合约

基于 **Uniswap V2 / V3** 的独立源码发布仓库。这里提供完整合约源码、必要 Solidity 依赖、上游测试、固定编译配置、SodaDEX NFT 品牌修改及现有部署地址。独立发布源码不会重新部署或改变现有合约。

本仓库不是 Uniswap 官方项目，不代表获得 Uniswap 的背书。Uniswap 的版权、作者署名和原始许可证均保留；商标不因代码许可而授予。

## 来源与目录

| 目录 | 内容与来源 | 许可 |
| --- | --- | --- |
| `upstream/v2-core` | Uniswap V2 Factory、Pair、ERC20、接口、上游测试；固定 commit 见 `PROVENANCE.json` | GPL-3.0，具体版本选择按原文件 |
| `upstream/v2-periphery` | Uniswap V2 Router01/02、接口和上游测试 | GPL-3.0-or-later；各文件保留 SPDX |
| `upstream/v3-core` | Uniswap V3 core 1.0.1 对应源码和测试 | 历史 BUSL 已转 GPL-2.0-or-later；部分文件 MIT / 双许可 |
| `upstream/v3-periphery` | Uniswap V3 periphery 1.4.4 对应源码和测试 | GPL-2.0-or-later；按文件原许可 |
| `vendor` | Uniswap lib、OpenZeppelin、base64-sol 的固定版本及许可 | 保留各包许可证 |
| `sodadex/v3` | V3 PositionManager、NFT Descriptor、SVG 的 SodaDEX 修改 | 保留原 GPL-2.0-or-later |
| `sodadex/common` | 原创 JSON/XML 转义、品牌 SVG helper | MIT，按原 SPDX |
| `verification` | 完整 solc 标准输入及官方产物，用于源码和字节码回归 | 继承对应来源许可 |
| `deployments` | 196 和 1952 的现有 V2/V3 地址与只读核验记录 | 地址资料；不含签名材料 |

不包含 SodaFlow / Uniswap V4、通用路由的 V4 依赖、IGNIX 业务合约或产品前后端。V3 的完整历史 BUSL 文本保留在原目录；不能因为历史 SPDX 仍写 BUSL，就把本仓库使用的旧 V3 版本误认为仍受商业使用期限限制。参见 [Uniswap V3 官方许可说明](https://support.uniswap.org/hc/en-us/articles/14569783029645-Uniswap-v3-licensing)。这项转换不适用于 V4 或其它不同版本。

## SodaDEX 修改

V2 Factory、Pair、Router 及 V3 core 的资金逻辑不修改。V3 periphery 的修改仅位于 `sodadex/` 覆盖层：NFT collection 名称 / symbol、元数据 / SVG，以及只读 `deploymentInfo()`。原有 permit 域使用新的 collection name。具体原始日期与修改行在源文件中保留；本次独立打包和验证工具新增于 2026-11-09。

修改版 V3 的编译标准输入逐文件与可读源码及依赖比对，避免发布的源码和构建输入不一致。上游目录保持原样，来源版本、下载摘要见 `PROVENANCE.json`。GPL 衍生代码不改成 MIT 或专有许可，也不附加“禁止商用”等限制；根 `LICENSE` 的 GPL-3.0 文本不替换各文件自己的许可。详见 [NOTICE.md](NOTICE.md)。

## 构建与测试

需要 Node.js、npm；运行链上业务测试还需要本机 Foundry 的 `anvil`。

```sh
npm ci --ignore-scripts
npm run build
npm test
```

构建使用锁定的 solc-js 0.5.16 / 0.6.6 / 0.7.6。构建与测试不需要钱包、真实链 RPC 或环境密钥。测试自行启动并关闭 `127.0.0.1:18556` 的 Anvil（chain ID 31337），端口占用时拒绝运行；不会向外部链广播。

测试覆盖官方 V2/V3 核心及 V2 Router creation bytecode / ABI 一致性、V3 品牌修改的 ABI 保持、实际本地 V2 建池 / 加仓 / 兑换、V3 建池 / 初始化 / 权限，以及品牌 PositionManager 的部署绑定。`upstream/*/test` 的完整上游测试保留，但这条命令不等同于执行所有上游历史测试或完成安全审计。产物写入忽略目录 `build/`。

## 部署地址

[196 现有地址](deployments/xlayer-196-existing.json) 保留 SodaDEX 原始部署记录的历史用途标签，不将旧记录中的 `test` 自动重命名成另一套生产合约。[1952 地址](deployments/xlayer-1952-existing.json) 是已存在的隔离验收栈。[196 独立测试地址](deployments/xlayer-196-separate-test.json) 为本轮新部署并完成隔离池验收的一套 V2/V3，不替换现有生产地址；文件附部署交易哈希。

只读核验结果与时间见 `deployments/verification.json`；合约存在和 getter 绑定不等于整套生产业务已验收。本仓库没有默认广播、签名或部署命令。
