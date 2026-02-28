# Primus Network SDK API Reference

完整的 Primus Network SDK API 接口文档，用于区块链网络交互、任务提交、Attestation 执行和结果查询。

---

## 目录

- [概述](#概述)
- [安装](#安装)
- [快速开始](#快速开始)
- [API 接口详解](#api-接口详解)
  - [init](#initprovider-chainid)
  - [submitTask](#submittaskattestparams)
  - [attest](#attestattestparams)
  - [verifyAndPollTaskResult](#verifyandpolltaskresultparams)
  - [withdrawBalance](#withdrawbalancetokensymbol-limit)
  - [queryTaskDetail](#querytaskdetailtaskid)
  - [getAllJsonResponse](#getalljsonresponsetaskid)
- [类型定义](#类型定义)
- [支持的网络](#支持的网络)
- [错误处理](#错误处理)
- [完整示例](#完整示例)

---

## 概述

PrimusNetwork SDK 是一个 TypeScript 库，用于与 Primus 区块链网络进行交互。它封装了智能合约交互，提供开发者友好的 API，主要功能包括：

- **SDK 初始化**：连接到指定的区块链网络
- **任务提交**：提交需要 Attestation 的任务到网络
- **Attestation 执行**：使用选定的节点进行验证
- **状态轮询**：持续检查任务状态和结果
- **余额提取**：从合约中领取奖励

---

## 安装

```bash
# 使用 npm
npm install @primuslabs/network-js-sdk

# 使用 yarn
yarn add @primuslabs/network-js-sdk
```

### 依赖

- `ethers` v5.x - 用于区块链交互
- 需要安装 [Primus Browser Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (版本 ≥ 0.3.44)

---

## 快速开始

### 1. 初始化 SDK

```typescript
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const primusNetwork = new PrimusNetwork();

async function initialize() {
  // 使用 MetaMask 提供者
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // 请求账户访问
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    
    // 切换到 Base Sepolia 网络 (Chain ID: 84532)
    await provider.send("wallet_switchEthereumChain", [
      { chainId: "0x" + (84532).toString(16) }
    ]);
    
    // 初始化 SDK
    await primusNetwork.init(signer, 84532);
    console.log("SDK 初始化成功");
  }
}
```

### 2. 查看支持的网络

```typescript
console.log(primusNetwork.supportedChainIds); 
// 输出：[84532, 8453]
```

---

## API 接口详解

### `init(provider, chainId)`

初始化 SDK 并连接到指定的区块链网络。

**参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `provider` | `ethers.providers.Web3Provider` \| `ethers.providers.JsonRpcProvider` \| `ethers.providers.JsonRpcSigner` | 是 | 以太坊提供者，可以是 MetaMask、WalletConnect 或自定义节点 |
| `chainId` | `number` | 是 | 链 ID，必须是支持的网络（84532 或 8453） |

**返回值：** `Promise<boolean>` - 初始化成功返回 `true`

**异常：**
- `chainId is not supported` - 不支持的链 ID
- `Please connect to the chain with ID ${chainId} first.` - 提供者未连接到指定的链

**示例：**

```typescript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
await primusNetwork.init(signer, 84532); // Base Sepolia
```

---

### `submitTask(attestParams)`

向网络提交一个新的 Attestation 任务。

**参数：**

```typescript
type PrimaryAttestationParams = {
  templateId: string;  // 任务模板 ID，在 Primus 开发者平台创建
  address: string;     // 用户钱包地址
}
```

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `templateId` | `string` | 是 | 任务模板的唯一标识符 |
| `address` | `string` | 是 | 提交任务的用户地址 |

**返回值：** `Promise<SubmitTaskReturnParams>`

```typescript
type SubmitTaskReturnParams = {
  taskId: string;        // 任务的唯一标识符
  taskTxHash: string;    // 提交任务的交易哈希
  taskAttestors: string[]; // 分配给该任务的 Attestor 节点地址列表
  submittedAt: number;   // 任务提交时间戳（秒）
}
```

**异常：**
- 模板 ID 无效
- 网络错误
- Gas 不足

**示例：**

```typescript
const submitTaskParams = {
  templateId: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
  address: "0x1234567890abcdef1234567890abcdef12345678"
};

const result = await primusNetwork.submitTask(submitTaskParams);
console.log("任务已提交:", result);
// {
//   taskId: "0xabc...",
//   taskTxHash: "0xdef...",
//   taskAttestors: ["0xnode1...", "0xnode2..."],
//   submittedAt: 1709107200
// }
```

---

### `attest(attestParams)`

使用分配的 Attestor 节点执行 Attestation 验证。

**参数：**

```typescript
type AttestAfterSubmitTaskParams = {
  // 必需参数（来自 submitTask 返回值）
  templateId: string;
  address: string;
  taskId: string;
  taskTxHash: string;
  taskAttestors: string[];
  
  // 可选参数
  extendedParams?: string;      // JSON 字符串，扩展参数
  allJsonResponseFlag?: 'true' | 'false';  // 是否获取完整 JSON 响应
  attConditions?: AttConditions; // Attestation 条件
}
```

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `templateId` | `string` | 是 | 任务模板 ID |
| `address` | `string` | 是 | 用户地址 |
| `taskId` | `string` | 是 | 任务 ID（来自 submitTask 返回值） |
| `taskTxHash` | `string` | 是 | 任务交易哈希（来自 submitTask 返回值） |
| `taskAttestors` | `string[]` | 是 | Attestor 节点列表（来自 submitTask 返回值） |
| `extendedParams` | `string` | 否 | JSON 字符串格式的扩展参数，如 `{ attUrlOptimization: true }` |
| `allJsonResponseFlag` | `'true' \| 'false'` | 否 | 是否获取完整的 HTTP 响应内容 |
| `attConditions` | `AttConditions` | 否 | Attestation 验证条件 |

**返回值：** `Promise<RawAttestationResultList>`

```typescript
type RawAttestationResultList = RawAttestationResult[];

type RawAttestationResult = {
  taskId: string;           // 任务 ID
  attestor: string;         // Attestor 地址
  attestation: any;         // Attestation 数据对象
  signature: string;        // 签名
  reportTxHash: string;     // 报告交易哈希
  attestorUrl: string;      // 使用的 Attestor URL
  attestationTime: number | string; // Attestation 时间
}
```

**内部流程：**
1. 从合约获取 Attestor 节点信息
2. 通过速度测试选择最快的 WebSocket URL
3. 依次使用每个 Attestor 节点执行证明
4. 将结果提交到链上

**示例：**

```typescript
const attestParams = {
  templateId: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  taskId: submitTaskResult.taskId,
  taskTxHash: submitTaskResult.taskTxHash,
  taskAttestors: submitTaskResult.taskAttestors,
  // 可选参数
  extendedParams: JSON.stringify({ attUrlOptimization: true })
};

const attestResult = await primusNetwork.attest(attestParams);
console.log("Attestation 完成:", attestResult);
// [
//   {
//     taskId: "0xabc...",
//     attestor: "0xnode1...",
//     attestation: { ... },
//     signature: "0x...",
//     reportTxHash: "0x...",
//     attestorUrl: "wss://node1.primus.io",
//     attestationTime: 1709107260
//   }
// ]
```

---

### `verifyAndPollTaskResult(params)`

轮询并验证任务结果，直到任务完成或超时。

**参数：**

```typescript
type VerifyAndPollTaskResultParams = {
  taskId: string;           // 任务 ID（必需）
  reportTxHash?: string;    // 报告交易哈希（可选，来自 attest 返回值）
  intervalMs?: number;      // 轮询间隔（毫秒），默认 2000
  timeoutMs?: number;       // 超时时间（毫秒），默认 60000 (1 分钟)
}
```

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `taskId` | `string` | 是 | - | 任务 ID |
| `reportTxHash` | `string` | 否 | - | 报告交易哈希，用于获取区块号加速查询 |
| `intervalMs` | `number` | 否 | `2000` | 轮询间隔（毫秒） |
| `timeoutMs` | `number` | 否 | `60000` | 超时时间（毫秒） |

**返回值：** `Promise<TaskResult[]>`

```typescript
type TaskResult = {
  taskId: string;
  attestor: string;
  attestation: AttestationInContract;
}

type AttestationInContract = {
  recipient: string;
  request: AttNetworkRequest[];
  responseResolve: AttNetworkResponseResolve[];
  data: string;              // JSON 字符串格式的真实数据
  attConditions: string;     // JSON 字符串格式的 Attestation 参数
  timestamp: bigint;
  additionParams: string;
}
```

**任务状态枚举：**

```typescript
enum TaskStatus {
  INIT = 0,                    // 初始状态
  SUCCESS = 1,                 // 成功
  PARTIAL_SUCCESS = 2,         // 部分成功
  PARTIAL_SUCCESS_SETTLED = 3, // 部分成功且已结算
  FAILED = 4                   // 失败
}
```

**异常：**
- `Polling timeout` - 轮询超时
- `Polling fail` - 轮询失败（任务状态为 INIT 或 FAILED）

**示例：**

```typescript
// 使用 attest 返回的 reportTxHash
const verifyParams = {
  taskId: attestResult[0].taskId,
  reportTxHash: attestResult[0].reportTxHash,
  intervalMs: 2000,
  timeoutMs: 60000
};

const taskResult = await primusNetwork.verifyAndPollTaskResult(verifyParams);
console.log("最终结果:", taskResult);
// [
//   {
//     taskId: "0xabc...",
//     attestor: "0xnode1...",
//     attestation: {
//       recipient: "0x...",
//       request: [...],
//       responseResolve: [...],
//       data: '{"verified": true, "value": "..."}',
//       ...
//     }
//   }
// ]
```

---

### `withdrawBalance(tokenSymbol?, limit?)`

从合约中提取已结算任务的奖励。

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `tokenSymbol` | `TokenSymbol` | 否 | `TokenSymbol.ETH` | 代币符号 |
| `limit` | `number` | 否 | `100` | 最大提取任务数 |

**返回值：** `Promise<string[]>` - 已结算的任务 ID 列表

**示例：**

```typescript
import { TokenSymbol } from "@primuslabs/network-js-sdk";

const settledTaskIds = await primusNetwork.withdrawBalance(TokenSymbol.ETH, 100);
console.log("已提取的任务:", settledTaskIds);
// ["0xtask1...", "0xtask2...", ...]
```

---

### `queryTaskDetail(taskId)`

查询任务的详细信息。

**参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `taskId` | `string` | 是 | 任务 ID |

**返回值：** `Promise<TaskInfo>` - 任务详细信息

```typescript
type TaskInfo = {
  templateId: string;
  submitter: string;
  attestors: string[];
  taskResults: TaskResult[];
  submittedAt: bigint;
  taskStatus: TaskStatus;
  tokenSymbol: TokenSymbol;
  callback: string;
}
```

**示例：**

```typescript
const taskDetail = await primusNetwork.queryTaskDetail(taskId);
console.log("任务详情:", taskDetail);
```

---

### `getAllJsonResponse(taskId)`

获取任务的完整 HTTP 响应内容（需要在 attest 时设置 `allJsonResponseFlag: 'true'`）。

**参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `taskId` | `string` | 是 | 任务 ID |

**返回值：** `string | undefined` - JSON 字符串格式的完整响应

**示例：**

```typescript
const jsonResponse = primusNetwork.getAllJsonResponse(taskId);
if (jsonResponse) {
  const data = JSON.parse(jsonResponse);
  console.log("完整响应:", data);
}
```

---

## 类型定义

### 核心类型

```typescript
// 基础 Attestation 参数
type PrimaryAttestationParams = {
  templateId: string;
  address: string;
}

// 高级 Attestation 参数
type SeniorAttestationParams = {
  additionParams?: string;
  attMode?: AttMode;
  attConditions?: AttConditions;
  backUrl?: string;
  computeMode?: ComputeMode;
  extendedParams?: string;
  allJsonResponseFlag?: 'true' | 'false';
}

// Attestation 模式
type AttMode = {
  algorithmType: 'mpctls' | 'proxytls';
  resultType: 'plain' | 'cipher';
}

// 计算模式
type ComputeMode = 'nonecomplete' | 'nonepartial' | 'normal';

// Attestation 条件
type AttConditions = AttCondition[];
type AttCondition = AttSubCondition[];
type AttSubCondition = {
  field: string;
  op: OpType;
  value?: string;
}

// 操作符类型
type OpType = '>' | '>=' | '=' | '!=' | '<' | '<=' | 'SHA256' | 'REVEAL_STRING';

// 网络请求
type AttNetworkRequest = {
  url: string;
  header: string;      // JSON 字符串
  method: string;
  body: string;
}

// 响应解析
type AttNetworkResponseResolve = {
  keyName: string;
  parseType: string;   // 'json' or 'html'
  parsePath: string;
}

// 代币符号
enum TokenSymbol {
  ETH
}
```

---

## 支持的网络

| Chain ID | 网络名称 | 合约地址 |
|----------|----------|----------|
| 84532 | Base Sepolia (测试网) | Task: `0xC02234058caEaA9416506eABf6Ef3122fCA939E8`<br>Node: `0xF7dc28456B19b2f8ca80B363c911CaDE1FB84bC6` |
| 8453 | Base Mainnet (主网) | Task: `0x151cb5eD5D10A42B607bB172B27BDF6F884b9707`<br>Node: `0x9C1bb8197720d08dA6B9dab5704a406a24C97642` |

### 添加 Base Sepolia 到 MetaMask

```typescript
await provider.send("wallet_addEthereumChain", [{
  chainId: "0x" + (84532).toString(16),
  chainName: "Base Sepolia",
  rpcUrls: ["https://sepolia.base.org"],
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  blockExplorerUrls: ["https://sepolia.basescan.org"]
}]);
```

---

## 错误处理

SDK 使用标准 Promise 错误处理，建议使用 try-catch：

```typescript
try {
  await primusNetwork.init(signer, 84532);
  const submitResult = await primusNetwork.submitTask(params);
  const attestResult = await primusNetwork.attest({ ...submitResult, ...params });
  const taskResult = await primusNetwork.verifyAndPollTaskResult({
    taskId: attestResult[0].taskId,
    reportTxHash: attestResult[0].reportTxHash
  });
} catch (error) {
  console.error("操作失败:", error);
  // 根据错误类型进行相应处理
}
```

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `chainId is not supported` | 不支持的链 ID | 使用 84532 或 8453 |
| `Please connect to the chain with ID ${chainId} first.` | 钱包未切换到正确网络 | 使用 `wallet_switchEthereumChain` |
| `MetaMask not detected` | 未安装 MetaMask | 安装 MetaMask 扩展 |
| `Polling timeout` | 任务执行超时 | 增加 `timeoutMs` 或检查任务状态 |
| Gas 不足 | 钱包 ETH 余额不足 | 充值测试网 ETH |

---

## 完整示例

```typescript
import { PrimusNetwork, TokenSymbol } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

async function main() {
  // 初始化
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  
  const primusNetwork = new PrimusNetwork();
  const CHAINID = 84532; // Base Sepolia
  
  // 切换网络
  await provider.send("wallet_switchEthereumChain", [
    { chainId: "0x" + CHAINID.toString(16) }
  ]);
  
  // 初始化 SDK
  await primusNetwork.init(signer, CHAINID);
  console.log("✅ SDK 初始化成功");
  
  // 获取用户地址
  const userAddress = await signer.getAddress();
  
  try {
    // 1. 提交任务
    const submitTaskParams = {
      templateId: "YOUR_TEMPLATE_ID",
      address: userAddress
    };
    
    const submitTaskResult: any = await primusNetwork.submitTask(submitTaskParams);
    console.log("✅ 任务已提交:", submitTaskResult);
    
    // 2. 执行 Attestation
    const attestParams = {
      ...submitTaskParams,
      ...submitTaskResult,
      extendedParams: JSON.stringify({ attUrlOptimization: true })
    };
    
    const attestResult = await primusNetwork.attest(attestParams);
    console.log("✅ Attestation 完成:", attestResult);
    
    // 3. 轮询任务结果
    const taskResult = await primusNetwork.verifyAndPollTaskResult({
      taskId: attestResult[0].taskId,
      reportTxHash: attestResult[0].reportTxHash,
      intervalMs: 2000,
      timeoutMs: 120000 // 2 分钟超时
    });
    
    console.log("✅ 最终结果:", taskResult);
    
    // 4. (可选) 获取完整 HTTP 响应
    const jsonResponse = primusNetwork.getAllJsonResponse(attestParams.taskId);
    if (jsonResponse) {
      console.log("完整响应:", JSON.parse(jsonResponse));
    }
    
    // 5. (可选) 提取奖励
    // const settledTaskIds = await primusNetwork.withdrawBalance(TokenSymbol.ETH);
    // console.log("已提取的任务:", settledTaskIds);
    
  } catch (error) {
    console.error("❌ 操作失败:", error);
    throw error;
  }
}

// 运行
main();
```

---

## 相关资源

- [Primus 开发者平台](https://dev.primuslabs.xyz)
- [Chrome 扩展下载](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)
- [GitHub SDK 仓库](https://github.com/primus-labs/primus-network-sdk)
- [示例代码](https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example)

---

**文档版本：** 1.0  
**SDK 版本：** 参考 [primus-network-sdk](https://github.com/primus-labs/primus-network-sdk)  
**最后更新：** 2026-02-28
