# Primus network-js-sdk Documentation

📚 Complete API documentation and usage guides for `@primuslabs/network-js-sdk` — a TypeScript/JavaScript SDK for DApp integration with Primus zkTLS network.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [🚀 Quick Start](./QUICKSTART.md) | Get started in 5 minutes, integrate into your DApp |
| [📋 API Reference](./API-REFERENCE.md) | Complete API reference for DApp developers |
| [📝 Examples](./examples/) | Runnable DApp example code |
| [🇨🇳 中文文档](./README-CN.md) | Chinese documentation |

---

## 🎯 What is network-js-sdk?

`@primuslabs/network-js-sdk` is a **TypeScript/JavaScript library for DApp integration** with the Primus zkTLS network. It enables web applications to perform privacy-preserving attestations of off-chain data directly from the browser.

**Built for DApp Developers:**

- ✅ **Browser-First**: Works with MetaMask, WalletConnect, and browser wallets
- ✅ **Minimal Code**: Add zkTLS attestations to your DApp in minutes
- ✅ **Full Flow**: Submit → Attest → Poll → Withdraw
- ✅ **Multi-Chain**: Base Sepolia (testnet) & Base Mainnet support

**Common DApp Use Cases:**

- 🔐 **Identity Verification**: Prove social media ownership without revealing credentials
- 💰 **DeFi Lending**: Verify income brackets without exposing exact amounts
- 🎯 **Credit Scoring**: Attest credit scores from Web2 on-chain
- 📊 **Data Verification**: Verify any Web2 API response with ZK proofs

---

## 🚀 Quick Start

### Installation

```bash
npm install @primuslabs/network-js-sdk ethers@5
```

### Minimal DApp Integration

```typescript
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

// 1. Connect user's wallet
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();

// 2. Initialize SDK
const primusNetwork = new PrimusNetwork();
await primusNetwork.init(signer, 84532); // Base Sepolia

// 3. Submit attestation task
const result = await primusNetwork.submitTask({
  templateId: "YOUR_TEMPLATE_ID",
  address: await signer.getAddress()
});

// 4. Execute attestation
const attestResult = await primusNetwork.attest({
  ...result,
  templateId: "YOUR_TEMPLATE_ID",
  address: await signer.getAddress()
});

// 5. Get verified result
const taskResult = await primusNetwork.verifyAndPollTaskResult({
  taskId: attestResult[0].taskId,
  reportTxHash: attestResult[0].reportTxHash
});

console.log("✅ Verified on-chain:", taskResult);
```

---

## 📦 Supported Networks

| Network | Chain ID | Use Case |
|---------|----------|----------|
| Base Sepolia | 84532 | ✅ Development & Testing |
| Base Mainnet | 8453 | ✅ Production DApps |

---

## 🔗 Resources

- **Developer Platform**: https://dev.primuslabs.xyz — Create attestation templates
- **Chrome Extension**: [Download](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (≥ 0.3.44)
- **SDK Source**: https://github.com/primus-labs/primus-network-sdk
- **Demo DApp**: https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example
- **Discord**: https://discord.gg/primus

---

## 📝 DApp Integration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Connect    │ ──► │  Submit     │ ──► │  Attest     │ ──► │  Poll       │
│  Wallet     │     │  Task       │     │  (zkTLS)    │     │  Result     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
  MetaMask            Create              Browser             Show
  Connection          On-Chain            Proof               Verified
                      Task                Execution           Data
```

1. **Connect Wallet** — User connects MetaMask or other wallet
2. **Submit Task** — Create attestation task on-chain
3. **Execute Attestation** — Browser extension performs zkTLS proof
4. **Poll Result** — Wait for verification and display to user
5. **Withdraw** — (Optional) Claim rewards for settled tasks

---

## 💡 DApp Use Cases

### 1. Social Media Verification DApp

```typescript
// Verify Twitter/X account ownership
const result = await primusNetwork.submitTask({
  templateId: "twitter-ownership-template-id",
  address: userAddress
});
```

### 2. DeFi Income Verification

```typescript
// Verify income bracket for lending without revealing exact amount
const result = await primusNetwork.submitTask({
  templateId: "income-bracket-template-id",
  address: userAddress
});
```

### 3. Credit Score Attestation

```typescript
// Attest credit score for on-chain reputation
const result = await primusNetwork.submitTask({
  templateId: "credit-score-template-id",
  address: userAddress
});
```

---

## 🛠️ Development Setup

- **Node.js**: >= 16.x
- **TypeScript**: >= 4.9.x
- **ethers**: 5.x
- **Wallet**: MetaMask or WalletConnect
- **Browser**: Chrome/Edge/Firefox with Primus Extension

---

## 📄 License

MIT License

---

**Maintained by**: Primus Labs  
**For**: DApp Developers  
**Last Updated**: 2026-02-28
