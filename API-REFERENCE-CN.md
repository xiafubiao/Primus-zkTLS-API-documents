# Primus network-js-sdk API 参考文档

`@primuslabs/network-js-sdk` 完整 API 文档 — 用于 DApp 集成 Primus zkTLS 网络的 TypeScript/JavaScript SDK。

---

## 目录

- [概述](#概述)
- [安装](#安装)
- [DApp 快速集成](#dapp-快速集成)
- [API 参考](#api-参考)
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
- [完整 DApp 示例](#完整-dapp-示例)

---

## 概述

`@primuslabs/network-js-sdk` 是一个专为 **DApp 集成** 设计的 TypeScript/JavaScript 库，用于与 Primus zkTLS 网络交互。它使 Web 应用能够直接在浏览器中执行隐私保护的链下数据证明。

**DApp 开发者核心功能：**

- **浏览器优先**：与 MetaMask 等浏览器钱包无缝集成
- **简单集成**： minimal 代码即可为 DApp 添加 zkTLS 证明
- **完整流程**：提交任务 → 执行证明 → 轮询结果 → 提取奖励
- **多链支持**：Base Sepolia（测试网）和 Base Mainnet

**常见 DApp 用例：**

- 🔐 **身份验证**：证明社交媒体账号所有权，无需暴露凭证
- 💰 **DeFi 借贷**：验证收入区间，无需暴露具体金额
- 🎯 **信用评分**：将 Web2 信用评分证明上链
- 📊 **数据验证**：使用零知识证明验证任意 Web2 API 响应

---

## 安装

```bash
# 使用 npm
npm install @primuslabs/network-js-sdk

# 使用 yarn
yarn add @primuslabs/network-js-sdk
```

### DApp 集成

**前端框架：**

```bash
# React / Next.js
npm install @primuslabs/network-js-sdk ethers@5

# Vue / Nuxt
npm install @primuslabs/network-js-sdk ethers@5

# 纯 JS (CDN)
<script type="module">
  import { PrimusNetwork } from "https://cdn.jsdelivr.net/npm/@primuslabs/network-js-sdk@latest/+esm";
</script>
```

**必需依赖：**

- `ethers` v5.x — 用于区块链交互（MetaMask、WalletConnect 等）
- [Primus Browser Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (版本 ≥ 0.3.44) — 浏览器中执行 zkTLS 证明必需

---

## DApp 快速集成

### 1. 在 DApp 中初始化

```typescript
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const primusNetwork = new PrimusNetwork();

async function initializeDApp() {
  // 连接用户钱包（MetaMask 等）
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // 请求钱包连接
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // 切换到 Base Sepolia（测试网）或 Base Mainnet
    await provider.send("wallet_switchEthereumChain", [
      { chainId: "0x" + (84532).toString(16) }
    ]);
    
    // 初始化 Primus SDK
    await primusNetwork.init(signer, 84532);
    console.log("✅ Primus SDK 已就绪，用户:", userAddress);
  }
}
```

### 2. 查看支持的网络

```typescript
console.log(primusNetwork.supportedChainIds); 
// 输出：[84532, 8453] - Base Sepolia 和 Base Mainnet
```

---

## API 参考

### `init(provider, chainId)`

初始化 SDK 并连接到指定的区块链网络。

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `provider` | `ethers.providers.Web3Provider` \| `ethers.providers.JsonRpcProvider` \| `ethers.providers.JsonRpcSigner` | 是 | 用户钱包的以太坊提供者（MetaMask、WalletConnect 等） |
| `chainId` | `number` | 是 | 链 ID：`84532`（Base Sepolia）或 `8453`（Base Mainnet） |

**返回值：** `Promise<boolean>` — 成功返回 `true`

**异常：**
- `chainId is not supported` — 不支持的链 ID
- `Please connect to the chain with ID ${chainId} first.` — 钱包未连接到正确网络

**DApp 示例：**

```typescript
// 在 React 组件或纯 JS 中
async function connectWallet() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  
  await primusNetwork.init(signer, 84532); // Base Sepolia 测试网
}
```

---

### `submitTask(attestParams)`

从 DApp 向 Primus 网络提交新的证明任务。

**参数：**

```typescript
type PrimaryAttestationParams = {
  templateId: string;  // 来自 Primus 开发者平台的模板 ID
  address: string;     // 用户钱包地址
}
```

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `templateId` | `string` | 是 | 在 https://dev.primuslabs.xyz 创建的模板 ID |
| `address` | `string` | 是 | 用户钱包地址（从连接的钱包获取） |

**返回值：** `Promise<SubmitTaskReturnParams>`

```typescript
type SubmitTaskReturnParams = {
  taskId: string;        // 唯一任务 ID
  taskTxHash: string;    // 交易哈希
  taskAttestors: string[]; // 分配的证明节点
  submittedAt: number;   // 提交时间戳
}
```

**DApp 示例：**

```typescript
// 用户连接钱包后
const userAddress = await signer.getAddress();

const submitResult = await primusNetwork.submitTask({
  templateId: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
  address: userAddress
});

console.log("任务已提交:", submitResult.taskId);
// 保存 submitResult 用于下一步
```

---

### `attest(attestParams)`

使用分配的证明节点执行 Attestation。这是 zkTLS 魔法发生的地方。

**参数：**

```typescript
type AttestAfterSubmitTaskParams = {
  // 必需（来自 submitTask 返回值）
  templateId: string;
  address: string;
  taskId: string;
  taskTxHash: string;
  taskAttestors: string[];
  
  // 可选
  extendedParams?: string;      // JSON 字符串：{ attUrlOptimization: true }
  allJsonResponseFlag?: 'true' | 'false';
  attConditions?: AttConditions;
}
```

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `templateId` | `string` | 是 | 与 submitTask 相同的模板 ID |
| `address` | `string` | 是 | 用户钱包地址 |
| `taskId` | `string` | 是 | 来自 `submitTask` 结果 |
| `taskTxHash` | `string` | 是 | 来自 `submitTask` 结果 |
| `taskAttestors` | `string[]` | 是 | 来自 `submitTask` 结果 |
| `extendedParams` | `string` | 否 | 扩展参数如 `{ attUrlOptimization: true }` |
| `allJsonResponseFlag` | `'true' \| 'false'` | 否 | 获取完整 HTTP 响应 |
| `attConditions` | `AttConditions` | 否 | 自定义证明条件 |

**返回值：** `Promise<RawAttestationResultList>`

```typescript
type RawAttestationResultList = RawAttestationResult[];

type RawAttestationResult = {
  taskId: string;
  attestor: string;
  attestation: any;
  signature: string;
  reportTxHash: string;
  attestorUrl: string;
  attestationTime: number | string;
}
```

**DApp 示例：**

```typescript
const attestResult = await primusNetwork.attest({
  templateId: "YOUR_TEMPLATE_ID",
  address: userAddress,
  taskId: submitResult.taskId,
  taskTxHash: submitResult.taskTxHash,
  taskAttestors: submitResult.taskAttestors
});

console.log("证明完成:", attestResult[0].reportTxHash);
```

---

### `verifyAndPollTaskResult(params)`

轮询任务状态直到完成。在 DApp UI 中使用此方法向用户显示进度。

**参数：**

```typescript
type VerifyAndPollTaskResultParams = {
  taskId: string;        // 必需
  reportTxHash?: string; // 可选，来自 attest 结果
  intervalMs?: number;   // 默认：2000
  timeoutMs?: number;    // 默认：60000（1 分钟）
}
```

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `taskId` | `string` | 是 | - | 要轮询的任务 ID |
| `reportTxHash` | `string` | 否 | - | 报告哈希，用于更快查询 |
| `intervalMs` | `number` | 否 | `2000` | 轮询间隔（毫秒） |
| `timeoutMs` | `number` | 否 | `60000` | 超时时间（毫秒） |

**返回值：** `Promise<TaskResult[]>`

**任务状态：**

```typescript
enum TaskStatus {
  INIT = 0,
  SUCCESS = 1,
  PARTIAL_SUCCESS = 2,
  PARTIAL_SUCCESS_SETTLED = 3,
  FAILED = 4
}
```

**DApp 示例：**

```typescript
// 在 UI 中显示加载状态
setLoading(true);

try {
  const taskResult = await primusNetwork.verifyAndPollTaskResult({
    taskId: attestResult[0].taskId,
    reportTxHash: attestResult[0].reportTxHash,
    intervalMs: 2000,
    timeoutMs: 120000 // DApp 使用 2 分钟
  });
  
  console.log("✅ 验证完成:", taskResult);
  // 用验证数据更新 UI
} catch (error) {
  console.error("验证失败:", error);
  // 向用户显示错误
} finally {
  setLoading(false);
}
```

---

### `withdrawBalance(tokenSymbol?, limit?)`

提取已结算任务的奖励。通常在 DApp 管理功能或用户仪表板中使用。

**参数：**

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `tokenSymbol` | `TokenSymbol` | 否 | `TokenSymbol.ETH` | 代币类型 |
| `limit` | `number` | 否 | `100` | 最大提取任务数 |

**返回值：** `Promise<string[]>` — 已结算任务 ID 列表

**DApp 示例：**

```typescript
import { TokenSymbol } from "@primuslabs/network-js-sdk";

// 在用户仪表板或管理面板中
const settledTasks = await primusNetwork.withdrawBalance(TokenSymbol.ETH, 100);
console.log("已提取奖励的任务:", settledTasks);
```

---

### `queryTaskDetail(taskId)`

查询详细任务信息。用于 DApp UI 显示任务状态。

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `taskId` | `string` | 是 | 任务 ID |

**返回值：** `Promise<TaskInfo>`

**DApp 示例：**

```typescript
// 在 UI 中显示任务状态
const taskDetail = await primusNetwork.queryTaskDetail(taskId);
console.log("任务状态:", TaskStatus[taskDetail.taskStatus]);
```

---

### `getAllJsonResponse(taskId)`

获取证明的完整 HTTP 响应。需要在 attest 调用时设置 `allJsonResponseFlag: 'true'`。

**参数：**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `taskId` | `string` | 是 | 任务 ID |

**返回值：** `string | undefined` — JSON 响应字符串

**DApp 示例：**

```typescript
const jsonResponse = primusNetwork.getAllJsonResponse(taskId);
if (jsonResponse) {
  const data = JSON.parse(jsonResponse);
  // 在 UI 中显示验证数据
}
```

---

## 类型定义

### DApp 开发者核心类型

```typescript
// 任务提交
type PrimaryAttestationParams = {
  templateId: string;
  address: string;
}

// 证明模式
type AttMode = {
  algorithmType: 'mpctls' | 'proxytls';
  resultType: 'plain' | 'cipher';
}

// 证明条件
type AttConditions = AttCondition[];
type AttSubCondition = {
  field: string;
  op: OpType;  // '>' | '>=' | '=' | '!=' | '<' | '<=' | 'SHA256' | 'REVEAL_STRING'
  value?: string;
}

// 网络请求（在模板中定义）
type AttNetworkRequest = {
  url: string;
  header: string;
  method: string;
  body: string;
}

// 代币
enum TokenSymbol {
  ETH
}

// 任务状态
enum TaskStatus {
  INIT = 0,
  SUCCESS = 1,
  PARTIAL_SUCCESS = 2,
  PARTIAL_SUCCESS_SETTLED = 3,
  FAILED = 4
}
```

---

## 支持的网络

| Chain ID | 网络 | 用途 |
|----------|------|------|
| 84532 | Base Sepolia | ✅ 开发和测试 |
| 8453 | Base Mainnet | ✅ 生产环境 DApp |

### 为用户添加 Base Sepolia 到钱包

```typescript
async function addBaseSepolia() {
  await provider.send("wallet_addEthereumChain", [{
    chainId: "0x" + (84532).toString(16),
    chainName: "Base Sepolia",
    rpcUrls: ["https://sepolia.base.org"],
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://sepolia.basescan.org"]
  }]);
}
```

---

## DApp 错误处理

```typescript
try {
  await primusNetwork.init(signer, 84532);
  const result = await primusNetwork.submitTask(params);
  // ... 继续流程
} catch (error: any) {
  // 用户友好的错误消息
  if (error.message.includes("chainId")) {
    alert("请切换到 Base Sepolia 网络");
  } else if (error.message.includes("MetaMask")) {
    alert("请安装 MetaMask 以使用此 DApp");
  } else if (error.message.includes("Polling timeout")) {
    alert("验证时间较长，请稍后查看或重试");
  } else {
    alert("操作失败：" + error.message);
  }
}
```

### 常见 DApp 错误

| 错误 | 用户友好提示 |
|------|-------------|
| `chainId is not supported` | "请切换到 Base Sepolia 或 Base Mainnet 网络" |
| `MetaMask not detected` | "请安装 MetaMask 以使用此 DApp" |
| `Polling timeout` | "验证时间较长，请等待或重试" |
| Insufficient Gas | "Gas 不足，请在钱包中添加一些 ETH" |

---

## 完整 DApp 示例

### React 组件示例

```typescript
import { useState } from 'react';
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const TEMPLATE_ID = "YOUR_TEMPLATE_ID";

export default function AttestationWidget() {
  const [status, setStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      setStatus('connected');
      setLoading(false);
    } catch (error) {
      setStatus('error');
      setLoading(false);
    }
  };

  const handleSubmitTask = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      const submitResult = await primusNetwork.submitTask({
        templateId: TEMPLATE_ID,
        address: userAddress
      });
      
      setStatus('submitted');
      setLoading(false);
      return submitResult;
    } catch (error) {
      setStatus('error');
      setLoading(false);
    }
  };

  // ... 继续实现 attest 和 pollResult
  
  return (
    <div>
      {status === 'disconnected' && (
        <button onClick={handleConnect} disabled={loading}>
          {loading ? '连接中...' : '连接钱包'}
        </button>
      )}
      {status === 'connected' && (
        <button onClick={handleSubmitTask} disabled={loading}>
          {loading ? '提交中...' : '提交证明'}
        </button>
      )}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

---

## DApp 开发者资源

- **Primus 开发者平台**: https://dev.primuslabs.xyz — 创建模板
- **Chrome 扩展**: [下载](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)
- **GitHub SDK**: https://github.com/primus-labs/primus-network-sdk
- **演示 DApp**: https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example
- **Discord 支持**: https://discord.gg/primus

---

**SDK 版本:** 查看 [@primuslabs/network-js-sdk](https://www.npmjs.com/package/@primuslabs/network-js-sdk)  
**最后更新:** 2026-02-28  
**面向:** DApp 开发者
