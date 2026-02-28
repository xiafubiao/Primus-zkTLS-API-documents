# Primus network-js-sdk API Reference

Complete API documentation for `@primuslabs/network-js-sdk` — a TypeScript/JavaScript SDK for DApp integration with Primus zkTLS network.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start for DApps](#quick-start-for-dapps)
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
- [Complete DApp Example](#complete-dapp-example)

---

## Overview

`@primuslabs/network-js-sdk` is a TypeScript/JavaScript library designed for **DApp integration** with the Primus zkTLS network. It enables web applications to perform privacy-preserving attestations of off-chain data directly from the browser.

**Key Features for DApp Developers:**

- **Browser-First SDK**: Works seamlessly with MetaMask and browser wallets
- **Simple Integration**: Minimal code required to add zkTLS attestations to your DApp
- **Attestation Flow**: Submit tasks → Execute attestations → Poll results → Claim rewards
- **Multi-Chain Support**: Base Sepolia (testnet) and Base Mainnet

**Common Use Cases:**

- 🔐 **Identity Verification**: Prove social media account ownership without revealing credentials
- 💰 **Income Proof**: Verify income brackets for DeFi lending without exposing exact amounts
- 🎯 **Credit Scoring**: Attest credit scores from traditional systems on-chain
- 📊 **Data Verification**: Verify any Web2 API response with zero-knowledge proofs

---

## Installation

```bash
# Using npm
npm install @primuslabs/network-js-sdk

# Using yarn
yarn add @primuslabs/network-js-sdk
```

### For DApp Integration

**Frontend Frameworks:**

```bash
# React / Next.js
npm install @primuslabs/network-js-sdk ethers@5

# Vue / Nuxt
npm install @primuslabs/network-js-sdk ethers@5

# Vanilla JS (CDN)
<script type="module">
  import { PrimusNetwork } from "https://cdn.jsdelivr.net/npm/@primuslabs/network-js-sdk@latest/+esm";
</script>
```

**Required Dependencies:**

- `ethers` v5.x — For blockchain interactions (MetaMask, WalletConnect, etc.)
- [Primus Browser Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (version ≥ 0.3.44) — Required for zkTLS attestations in browser

---

## Quick Start for DApps

### 1. Initialize in Your DApp

```typescript
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const primusNetwork = new PrimusNetwork();

async function initializeDApp() {
  // Connect to user's wallet (MetaMask, etc.)
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request wallet connection
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Switch to Base Sepolia (testnet) or Base Mainnet
    await provider.send("wallet_switchEthereumChain", [
      { chainId: "0x" + (84532).toString(16) }
    ]);
    
    // Initialize Primus SDK
    await primusNetwork.init(signer, 84532);
    console.log("✅ Primus SDK ready for user:", userAddress);
  }
}
```

### 2. Check Supported Networks

```typescript
console.log(primusNetwork.supportedChainIds); 
// Output: [84532, 8453] - Base Sepolia & Base Mainnet
```

---

## API Reference

### `init(provider, chainId)`

Initialize the SDK and connect to the specified blockchain network.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | `ethers.providers.Web3Provider` \| `ethers.providers.JsonRpcProvider` \| `ethers.providers.JsonRpcSigner` | Yes | Ethereum provider from user's wallet (MetaMask, WalletConnect, etc.) |
| `chainId` | `number` | Yes | Chain ID: `84532` (Base Sepolia) or `8453` (Base Mainnet) |

**Returns:** `Promise<boolean>` — `true` on success

**Throws:**
- `chainId is not supported` — Unsupported chain ID
- `Please connect to the chain with ID ${chainId} first.` — Wallet not on correct network

**DApp Example:**

```typescript
// In your React component or vanilla JS
async function connectWallet() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  
  await primusNetwork.init(signer, 84532); // Base Sepolia testnet
}
```

---

### `submitTask(attestParams)`

Submit a new Attestation task to the Primus network from your DApp.

**Parameters:**

```typescript
type PrimaryAttestationParams = {
  templateId: string;  // Template ID from Primus Developer Platform
  address: string;     // User's wallet address
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | `string` | Yes | Template ID created at https://dev.primuslabs.xyz |
| `address` | `string` | Yes | User's wallet address (from connected wallet) |

**Returns:** `Promise<SubmitTaskReturnParams>`

```typescript
type SubmitTaskReturnParams = {
  taskId: string;        // Unique task ID
  taskTxHash: string;    // Transaction hash
  taskAttestors: string[]; // Assigned Attestor nodes
  submittedAt: number;   // Submission timestamp
}
```

**DApp Example:**

```typescript
// After user connects wallet
const userAddress = await signer.getAddress();

const submitResult = await primusNetwork.submitTask({
  templateId: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
  address: userAddress
});

console.log("Task submitted:", submitResult.taskId);
// Save submitResult for next step
```

---

### `attest(attestParams)`

Execute Attestation using assigned Attestor nodes. This is where the zkTLS magic happens.

**Parameters:**

```typescript
type AttestAfterSubmitTaskParams = {
  // Required (from submitTask return)
  templateId: string;
  address: string;
  taskId: string;
  taskTxHash: string;
  taskAttestors: string[];
  
  // Optional
  extendedParams?: string;      // JSON string: { attUrlOptimization: true }
  allJsonResponseFlag?: 'true' | 'false';
  attConditions?: AttConditions;
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | `string` | Yes | Same template ID as submitTask |
| `address` | `string` | Yes | User's wallet address |
| `taskId` | `string` | Yes | From `submitTask` result |
| `taskTxHash` | `string` | Yes | From `submitTask` result |
| `taskAttestors` | `string[]` | Yes | From `submitTask` result |
| `extendedParams` | `string` | No | Extended params like `{ attUrlOptimization: true }` |
| `allJsonResponseFlag` | `'true' \| 'false'` | No | Get full HTTP response |
| `attConditions` | `AttConditions` | No | Custom attestation conditions |

**Returns:** `Promise<RawAttestationResultList>`

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

**DApp Example:**

```typescript
const attestResult = await primusNetwork.attest({
  templateId: "YOUR_TEMPLATE_ID",
  address: userAddress,
  taskId: submitResult.taskId,
  taskTxHash: submitResult.taskTxHash,
  taskAttestors: submitResult.taskAttestors
});

console.log("Attestation complete:", attestResult[0].reportTxHash);
```

---

### `verifyAndPollTaskResult(params)`

Poll task status until completion. Use this in your DApp UI to show progress to users.

**Parameters:**

```typescript
type VerifyAndPollTaskResultParams = {
  taskId: string;        // Required
  reportTxHash?: string; // Optional, from attest result
  intervalMs?: number;   // Default: 2000
  timeoutMs?: number;    // Default: 60000 (1 minute)
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `taskId` | `string` | Yes | - | Task ID to poll |
| `reportTxHash` | `string` | No | - | Report hash for faster lookup |
| `intervalMs` | `number` | No | `2000` | Polling interval (ms) |
| `timeoutMs` | `number` | No | `60000` | Timeout (ms) |

**Returns:** `Promise<TaskResult[]>`

**Task Status:**

```typescript
enum TaskStatus {
  INIT = 0,
  SUCCESS = 1,
  PARTIAL_SUCCESS = 2,
  PARTIAL_SUCCESS_SETTLED = 3,
  FAILED = 4
}
```

**DApp Example:**

```typescript
// Show loading state in UI
setLoading(true);

try {
  const taskResult = await primusNetwork.verifyAndPollTaskResult({
    taskId: attestResult[0].taskId,
    reportTxHash: attestResult[0].reportTxHash,
    intervalMs: 2000,
    timeoutMs: 120000 // 2 minutes for DApps
  });
  
  console.log("✅ Verification complete:", taskResult);
  // Update UI with verified data
} catch (error) {
  console.error("Verification failed:", error);
  // Show error to user
} finally {
  setLoading(false);
}
```

---

### `withdrawBalance(tokenSymbol?, limit?)`

Withdraw rewards for settled tasks. Typically used in DApp admin functions or user dashboards.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tokenSymbol` | `TokenSymbol` | No | `TokenSymbol.ETH` | Token type |
| `limit` | `number` | No | `100` | Max tasks to withdraw |

**Returns:** `Promise<string[]>` — List of settled task IDs

**DApp Example:**

```typescript
import { TokenSymbol } from "@primuslabs/network-js-sdk";

// In user dashboard or admin panel
const settledTasks = await primusNetwork.withdrawBalance(TokenSymbol.ETH, 100);
console.log("Withdrawn rewards for tasks:", settledTasks);
```

---

### `queryTaskDetail(taskId)`

Query detailed task information. Useful for DApp UI to display task status.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | `string` | Yes | Task ID |

**Returns:** `Promise<TaskInfo>`

**DApp Example:**

```typescript
// Display task status in UI
const taskDetail = await primusNetwork.queryTaskDetail(taskId);
console.log("Task status:", TaskStatus[taskDetail.taskStatus]);
```

---

### `getAllJsonResponse(taskId)`

Get complete HTTP response from attestation. Requires `allJsonResponseFlag: 'true'` in attest call.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | `string` | Yes | Task ID |

**Returns:** `string | undefined` — JSON response string

**DApp Example:**

```typescript
const jsonResponse = primusNetwork.getAllJsonResponse(taskId);
if (jsonResponse) {
  const data = JSON.parse(jsonResponse);
  // Display verified data in UI
}
```

---

## Type Definitions

### Core Types for DApp Developers

```typescript
// Task Submission
type PrimaryAttestationParams = {
  templateId: string;
  address: string;
}

// Attestation Mode
type AttMode = {
  algorithmType: 'mpctls' | 'proxytls';
  resultType: 'plain' | 'cipher';
}

// Attestation Conditions
type AttConditions = AttCondition[];
type AttSubCondition = {
  field: string;
  op: OpType;  // '>' | '>=' | '=' | '!=' | '<' | '<=' | 'SHA256' | 'REVEAL_STRING'
  value?: string;
}

// Network Request (defined in template)
type AttNetworkRequest = {
  url: string;
  header: string;
  method: string;
  body: string;
}

// Token
enum TokenSymbol {
  ETH
}

// Task Status
enum TaskStatus {
  INIT = 0,
  SUCCESS = 1,
  PARTIAL_SUCCESS = 2,
  PARTIAL_SUCCESS_SETTLED = 3,
  FAILED = 4
}
```

---

## Supported Networks

| Chain ID | Network | Use Case |
|----------|---------|----------|
| 84532 | Base Sepolia | ✅ Development & Testing |
| 8453 | Base Mainnet | ✅ Production DApps |

### Add Base Sepolia to User's Wallet

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

## Error Handling for DApps

```typescript
try {
  await primusNetwork.init(signer, 84532);
  const result = await primusNetwork.submitTask(params);
  // ... continue flow
} catch (error: any) {
  // User-friendly error messages
  if (error.message.includes("chainId")) {
    alert("Please switch to Base Sepolia network");
  } else if (error.message.includes("MetaMask")) {
    alert("Please install MetaMask");
  } else if (error.message.includes("Polling timeout")) {
    alert("Verification is taking longer than expected. Please check back later.");
  } else {
    alert("Operation failed: " + error.message);
  }
}
```

### Common DApp Errors

| Error | User-Friendly Message |
|-------|----------------------|
| `chainId is not supported` | "Please switch to Base Sepolia or Base Mainnet" |
| `MetaMask not detected` | "Please install MetaMask to use this DApp" |
| `Polling timeout` | "Verification is taking longer. Please wait or try again." |
| Insufficient Gas | "Insufficient ETH for gas. Please add some ETH to your wallet." |

---

## Complete DApp Example

### React Component Example

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

  const handleAttest = async (submitResult: any) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      const attestResult = await primusNetwork.attest({
        templateId: TEMPLATE_ID,
        address: userAddress,
        ...submitResult
      });
      
      setStatus('attested');
      setLoading(false);
      return attestResult;
    } catch (error) {
      setStatus('error');
      setLoading(false);
    }
  };

  const handlePollResult = async (attestResult: any) => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      const taskResult = await primusNetwork.verifyAndPollTaskResult({
        taskId: attestResult[0].taskId,
        reportTxHash: attestResult[0].reportTxHash,
        intervalMs: 2000,
        timeoutMs: 120000
      });
      
      setResult(taskResult);
      setStatus('complete');
      setLoading(false);
    } catch (error) {
      setStatus('error');
      setLoading(false);
    }
  };

  return (
    <div>
      {status === 'disconnected' && (
        <button onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      {status === 'connected' && (
        <button onClick={handleSubmitTask} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Attestation'}
        </button>
      )}
      {/* Continue for other states... */}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

---

## Resources for DApp Developers

- **Primus Developer Platform**: https://dev.primuslabs.xyz — Create templates
- **Chrome Extension**: [Download](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)
- **GitHub SDK**: https://github.com/primus-labs/primus-network-sdk
- **Demo DApp**: https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example
- **Discord Support**: https://discord.gg/primus

---

**SDK Version:** See [@primuslabs/network-js-sdk](https://www.npmjs.com/package/@primuslabs/network-js-sdk)  
**Last Updated:** 2026-02-28  
**For:** DApp Developers
