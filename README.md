# Primus zkTLS API Documents

📚 Complete API documentation and usage guides for Primus Network SDK.

---

## 📖 Documentation / 文档

| Document / 文档 | Description / 描述 |
|-----------------|-------------------|
| [🚀 Quick Start](./QUICKSTART.md) | Get started in 5 minutes / 5 分钟快速入门 |
| [📋 API Reference](./API-REFERENCE.md) | Complete API reference / 完整 API 参考 |
| [📝 Examples](./examples/) | Runnable example code / 可运行示例 |
| [🇨🇳 中文快速入门](./QUICKSTART-CN.md) | Chinese quick start guide |
| [🇨🇳 中文 API 参考](./API-REFERENCE-CN.md) | Chinese API reference |

---

## 🌍 Languages / 语言

- **English**: [README](./README-EN.md) | [API Reference](./API-REFERENCE.md) | [Quick Start](./QUICKSTART.md)
- **中文**: [README](./README-CN.md) | [API 参考](./API-REFERENCE-CN.md) | [快速入门](./QUICKSTART-CN.md)

---

## 🎯 What is Primus Network SDK?

PrimusNetwork SDK is a TypeScript library for interacting with the Primus zkTLS network. It enables developers to:

- ✅ **Verify Off-Chain Data** - Attest Web2 API data through zkTLS proofs
- ✅ **Protect Privacy** - Use zero-knowledge proof technology
- ✅ **On-Chain Verification** - Submit verification results to blockchain
- ✅ **Build Trusted Apps** - Create DApps based on real-world data

---

## 🚀 Quick Start

```bash
npm install @primuslabs/network-js-sdk ethers@5
```

```typescript
import { PrimusNetwork } from "@primuslabs/network-js-sdk";

const primusNetwork = new PrimusNetwork();
await primusNetwork.init(signer, 84532);

const result = await primusNetwork.submitTask({
  templateId: "YOUR_TEMPLATE_ID",
  address: userAddress
});
```

---

## 📦 Supported Networks

| Network | Chain ID |
|---------|----------|
| Base Sepolia | 84532 |
| Base Mainnet | 8453 |

---

## 🔗 Resources

- **Developer Platform**: https://dev.primuslabs.xyz
- **Chrome Extension**: [Download](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)
- **SDK Source**: https://github.com/primus-labs/primus-network-sdk
- **Examples**: https://github.com/primus-labs/zktls-demo

---

**Last Updated**: 2026-02-28
