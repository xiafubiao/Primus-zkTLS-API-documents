# Primus Network SDK API Reference

Complete API documentation for Primus Network SDK, enabling blockchain network interaction, task submission, Attestation execution, and result querying.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [init](#initprovider-chainid)
  - [submitTask](#submittaskattestparams)
  - [attest](#attestattestparams)
  - [verifyAndPollTaskResult](#verifyandpolltaskresultparams)
  - [withdrawBalance](#withdrawbalancetokensymbol-limit)
  - [queryTaskDetail](#querytaskdetailtaskid)
  - [getAllJsonResponse](#getalljsonresponsetaskid)
- [Type Definitions](#type-definitions)
- [Supported Networks](#supported-networks)
- [Error Handling](#error-handling)
- [Complete Example](#complete-example)

---

## Overview

PrimusNetwork SDK is a TypeScript library for interacting with the Primus blockchain network. It abstracts smart contract interactions through a developer-friendly API, with main features including:

- **SDK Initialization**: Connect to specified blockchain networks
- **Task Submission**: Submit tasks requiring Attestation to the network
- **Attestation Execution**: Perform verification using selected nodes
- **Status Polling**: Continuously check task status and results
- **Balance Withdrawal**: Claim rewards from the contract

---

## Installation

```bash
# Using npm
npm install @primuslabs/network-js-sdk

# Using yarn
yarn add @primuslabs/network-js-sdk
```

### Dependencies

- `ethers` v5.x - For blockchain interactions
- [Primus Browser Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (version ≥ 0.3.44) required

---

## Quick Start

### 1. Initialize SDK

```typescript
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const primusNetwork = new PrimusNetwork();

async function initialize() {
  // Using MetaMask provider
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request account access
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    
    // Switch to Base Sepolia network (Chain ID: 84532)
    await provider.send("wallet_switchEthereumChain", [
      { chainId: "0x" + (84532).toString(16) }
    ]);
    
    // Initialize SDK
    await primusNetwork.init(signer, 84532);
    console.log("SDK initialized successfully");
  }
}
```

### 2. View Supported Networks

```typescript
console.log(primusNetwork.supportedChainIds); 
// Output: [84532, 8453]
```

---

## API Reference

### `init(provider, chainId)`

Initialize the SDK and connect to the specified blockchain network.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | `ethers.providers.Web3Provider` \| `ethers.providers.JsonRpcProvider` \| `ethers.providers.JsonRpcSigner` | Yes | Ethereum provider (MetaMask, WalletConnect, or custom node) |
| `chainId` | `number` | Yes | Chain ID, must be a supported network (84532 or 8453) |

**Returns:** `Promise<boolean>` - Returns `true` on successful initialization

**Throws:**
- `chainId is not supported` - Unsupported chain ID
- `Please connect to the chain with ID ${chainId} first.` - Provider not connected to specified chain

**Example:**

```typescript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
await primusNetwork.init(signer, 84532); // Base Sepolia
```

---

### `submitTask(attestParams)`

Submit a new Attestation task to the network.

**Parameters:**

```typescript
type PrimaryAttestationParams = {
  templateId: string;  // Task template ID, created on Primus Developer Platform
  address: string;     // User wallet address
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | `string` | Yes | Unique identifier for the task template |
| `address` | `string` | Yes | User address submitting the task |

**Returns:** `Promise<SubmitTaskReturnParams>`

```typescript
type SubmitTaskReturnParams = {
  taskId: string;        // Unique task identifier
  taskTxHash: string;    // Transaction hash for task submission
  taskAttestors: string[]; // List of Attestor node addresses assigned to the task
  submittedAt: number;   // Task submission timestamp (seconds)
}
```

**Throws:**
- Invalid template ID
- Network errors
- Insufficient Gas

**Example:**

```typescript
const submitTaskParams = {
  templateId: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
  address: "0x1234567890abcdef1234567890abcdef12345678"
};

const result = await primusNetwork.submitTask(submitTaskParams);
console.log("Task submitted:", result);
// {
//   taskId: "0xabc...",
//   taskTxHash: "0xdef...",
//   taskAttestors: ["0xnode1...", "0xnode2..."],
//   submittedAt: 1709107200
// }
```

---

### `attest(attestParams)`

Execute Attestation verification using assigned Attestor nodes.

**Parameters:**

```typescript
type AttestAfterSubmitTaskParams = {
  // Required parameters (from submitTask return value)
  templateId: string;
  address: string;
  taskId: string;
  taskTxHash: string;
  taskAttestors: string[];
  
  // Optional parameters
  extendedParams?: string;      // JSON string, extended parameters
  allJsonResponseFlag?: 'true' | 'false';  // Whether to get full JSON response
  attConditions?: AttConditions; // Attestation conditions
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | `string` | Yes | Task template ID |
| `address` | `string` | Yes | User address |
| `taskId` | `string` | Yes | Task ID (from submitTask return value) |
| `taskTxHash` | `string` | Yes | Task transaction hash (from submitTask return value) |
| `taskAttestors` | `string[]` | Yes | Attestor node list (from submitTask return value) |
| `extendedParams` | `string` | No | Extended parameters in JSON string format, e.g., `{ attUrlOptimization: true }` |
| `allJsonResponseFlag` | `'true' \| 'false'` | No | Whether to retrieve complete HTTP response content |
| `attConditions` | `AttConditions` | No | Attestation verification conditions |

**Returns:** `Promise<RawAttestationResultList>`

```typescript
type RawAttestationResultList = RawAttestationResult[];

type RawAttestationResult = {
  taskId: string;           // Task ID
  attestor: string;         // Attestor address
  attestation: any;         // Attestation data object
  signature: string;        // Signature
  reportTxHash: string;     // Report transaction hash
  attestorUrl: string;      // Used Attestor URL
  attestationTime: number | string; // Attestation timestamp
}
```

**Internal Process:**
1. Fetch Attestor node information from contract
2. Select fastest WebSocket URL through speed testing
3. Execute proofs sequentially using each Attestor node
4. Submit results to chain

**Example:**

```typescript
const attestParams = {
  templateId: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  taskId: submitTaskResult.taskId,
  taskTxHash: submitTaskResult.taskTxHash,
  taskAttestors: submitTaskResult.taskAttestors,
  // Optional parameters
  extendedParams: JSON.stringify({ attUrlOptimization: true })
};

const attestResult = await primusNetwork.attest(attestParams);
console.log("Attestation completed:", attestResult);
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

Poll and verify task results until completion or timeout.

**Parameters:**

```typescript
type VerifyAndPollTaskResultParams = {
  taskId: string;           // Task ID (required)
  reportTxHash?: string;    // Report transaction hash (optional, from attest return value)
  intervalMs?: number;      // Polling interval (ms), default 2000
  timeoutMs?: number;       // Timeout (ms), default 60000 (1 minute)
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `taskId` | `string` | Yes | - | Task ID |
| `reportTxHash` | `string` | No | - | Report transaction hash for faster query via block number |
| `intervalMs` | `number` | No | `2000` | Polling interval (milliseconds) |
| `timeoutMs` | `number` | No | `60000` | Timeout (milliseconds) |

**Returns:** `Promise<TaskResult[]>`

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
  data: string;              // Real data in JSON string format
  attConditions: string;     // Attestation parameters in JSON string format
  timestamp: bigint;
  additionParams: string;
}
```

**Task Status Enum:**

```typescript
enum TaskStatus {
  INIT = 0,                    // Initial state
  SUCCESS = 1,                 // Success
  PARTIAL_SUCCESS = 2,         // Partial success
  PARTIAL_SUCCESS_SETTLED = 3, // Partial success and settled
  FAILED = 4                   // Failed
}
```

**Throws:**
- `Polling timeout` - Polling timed out
- `Polling fail` - Polling failed (task status is INIT or FAILED)

**Example:**

```typescript
// Using reportTxHash from attest return value
const verifyParams = {
  taskId: attestResult[0].taskId,
  reportTxHash: attestResult[0].reportTxHash,
  intervalMs: 2000,
  timeoutMs: 60000
};

const taskResult = await primusNetwork.verifyAndPollTaskResult(verifyParams);
console.log("Final result:", taskResult);
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

Withdraw rewards for settled tasks from the contract.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tokenSymbol` | `TokenSymbol` | No | `TokenSymbol.ETH` | Token symbol |
| `limit` | `number` | No | `100` | Maximum number of tasks to withdraw |

**Returns:** `Promise<string[]>` - List of settled task IDs

**Example:**

```typescript
import { TokenSymbol } from "@primuslabs/network-js-sdk";

const settledTaskIds = await primusNetwork.withdrawBalance(TokenSymbol.ETH, 100);
console.log("Withdrawn tasks:", settledTaskIds);
// ["0xtask1...", "0xtask2...", ...]
```

---

### `queryTaskDetail(taskId)`

Query detailed task information.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | `string` | Yes | Task ID |

**Returns:** `Promise<TaskInfo>` - Detailed task information

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

**Example:**

```typescript
const taskDetail = await primusNetwork.queryTaskDetail(taskId);
console.log("Task detail:", taskDetail);
```

---

### `getAllJsonResponse(taskId)`

Get complete HTTP response content for a task (requires `allJsonResponseFlag: 'true'` in attest).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | `string` | Yes | Task ID |

**Returns:** `string | undefined` - Complete response in JSON string format

**Example:**

```typescript
const jsonResponse = primusNetwork.getAllJsonResponse(taskId);
if (jsonResponse) {
  const data = JSON.parse(jsonResponse);
  console.log("Complete response:", data);
}
```

---

## Type Definitions

### Core Types

```typescript
// Basic Attestation Parameters
type PrimaryAttestationParams = {
  templateId: string;
  address: string;
}

// Advanced Attestation Parameters
type SeniorAttestationParams = {
  additionParams?: string;
  attMode?: AttMode;
  attConditions?: AttConditions;
  backUrl?: string;
  computeMode?: ComputeMode;
  extendedParams?: string;
  allJsonResponseFlag?: 'true' | 'false';
}

// Attestation Mode
type AttMode = {
  algorithmType: 'mpctls' | 'proxytls';
  resultType: 'plain' | 'cipher';
}

// Compute Mode
type ComputeMode = 'nonecomplete' | 'nonepartial' | 'normal';

// Attestation Conditions
type AttConditions = AttCondition[];
type AttCondition = AttSubCondition[];
type AttSubCondition = {
  field: string;
  op: OpType;
  value?: string;
}

// Operator Type
type OpType = '>' | '>=' | '=' | '!=' | '<' | '<=' | 'SHA256' | 'REVEAL_STRING';

// Network Request
type AttNetworkRequest = {
  url: string;
  header: string;      // JSON string
  method: string;
  body: string;
}

// Response Resolution
type AttNetworkResponseResolve = {
  keyName: string;
  parseType: string;   // 'json' or 'html'
  parsePath: string;
}

// Token Symbol
enum TokenSymbol {
  ETH
}
```

---

## Supported Networks

| Chain ID | Network Name | Contract Addresses |
|----------|--------------|-------------------|
| 84532 | Base Sepolia (Testnet) | Task: `0xC02234058caEaA9416506eABf6Ef3122fCA939E8`<br>Node: `0xF7dc28456B19b2f8ca80B363c911CaDE1FB84bC6` |
| 8453 | Base Mainnet | Task: `0x151cb5eD5D10A42B607bB172B27BDF6F884b9707`<br>Node: `0x9C1bb8197720d08dA6B9dab5704a406a24C97642` |

### Add Base Sepolia to MetaMask

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

## Error Handling

SDK uses standard Promise error handling. Use try-catch blocks:

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
  console.error("Operation failed:", error);
  // Handle error based on type
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `chainId is not supported` | Unsupported chain ID | Use 84532 or 8453 |
| `Please connect to the chain with ID ${chainId} first.` | Wallet not switched to correct network | Use `wallet_switchEthereumChain` |
| `MetaMask not detected` | MetaMask not installed | Install MetaMask extension |
| `Polling timeout` | Task execution timeout | Increase `timeoutMs` or check task status |
| Insufficient Gas | Low ETH balance in wallet | Fund with testnet ETH |

---

## Complete Example

```typescript
import { PrimusNetwork, TokenSymbol } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

async function main() {
  // Initialize
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  
  const primusNetwork = new PrimusNetwork();
  const CHAINID = 84532; // Base Sepolia
  
  // Switch network
  await provider.send("wallet_switchEthereumChain", [
    { chainId: "0x" + CHAINID.toString(16) }
  ]);
  
  // Initialize SDK
  await primusNetwork.init(signer, CHAINID);
  console.log("✅ SDK initialized");
  
  // Get user address
  const userAddress = await signer.getAddress();
  
  try {
    // 1. Submit Task
    const submitTaskParams = {
      templateId: "YOUR_TEMPLATE_ID",
      address: userAddress
    };
    
    const submitTaskResult: any = await primusNetwork.submitTask(submitTaskParams);
    console.log("✅ Task submitted:", submitTaskResult);
    
    // 2. Execute Attestation
    const attestParams = {
      ...submitTaskParams,
      ...submitTaskResult,
      extendedParams: JSON.stringify({ attUrlOptimization: true })
    };
    
    const attestResult = await primusNetwork.attest(attestParams);
    console.log("✅ Attestation completed:", attestResult);
    
    // 3. Poll Task Result
    const taskResult = await primusNetwork.verifyAndPollTaskResult({
      taskId: attestResult[0].taskId,
      reportTxHash: attestResult[0].reportTxHash,
      intervalMs: 2000,
      timeoutMs: 120000 // 2 minutes timeout
    });
    
    console.log("✅ Final result:", taskResult);
    
    // 4. (Optional) Get complete HTTP response
    const jsonResponse = primusNetwork.getAllJsonResponse(attestParams.taskId);
    if (jsonResponse) {
      console.log("Complete response:", JSON.parse(jsonResponse));
    }
    
    // 5. (Optional) Withdraw rewards
    // const settledTaskIds = await primusNetwork.withdrawBalance(TokenSymbol.ETH);
    // console.log("Withdrawn tasks:", settledTaskIds);
    
  } catch (error) {
    console.error("❌ Operation failed:", error);
    throw error;
  }
}

// Run
main();
```

---

## Resources

- [Primus Developer Platform](https://dev.primuslabs.xyz)
- [Chrome Extension Download](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)
- [GitHub SDK Repository](https://github.com/primus-labs/primus-network-sdk)
- [Example Code](https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example)

---

**Documentation Version:** 1.0  
**SDK Version:** See [primus-network-sdk](https://github.com/primus-labs/primus-network-sdk)  
**Last Updated:** 2026-02-28
