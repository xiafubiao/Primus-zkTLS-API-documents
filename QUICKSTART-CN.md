# Primus network-js-sdk 快速入门

5 分钟上手 `@primuslabs/network-js-sdk`，将 zkTLS 证明集成到你的 DApp 中。

---

## 前置条件

1. **MetaMask** 浏览器扩展
2. **Primus Extension** [下载](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (版本 ≥ 0.3.44)
3. **测试网 ETH** — 从 [Base Sepolia Faucet](https://sepolia.basescan.org/faucet) 获取

---

## 步骤 1：创建 DApp 项目

```bash
# 创建新项目
mkdir my-dapp-primus
cd my-dapp-primus

# 使用 Vite 创建 React 项目
npm create vite@latest . -- --template react-ts

# 安装依赖
npm install @primuslabs/network-js-sdk ethers@5
```

---

## 步骤 2：创建模板

编码之前，先创建证明模板：

1. 访问 [Primus 开发者平台](https://dev.primuslabs.xyz/myDevelopment/myTemplates/new)
2. 登录并创建新模板
3. 配置：
   - **API 端点** - 要验证的 Web2 API
   - **数据字段** - 要提取的字段
   - **验证条件** - 证明规则
4. **保存模板 ID** — 后续代码中需要用到

示例：
- **模板名称:** X 账号所有权证明
- **模板 ID:** `2e3160ae-8b1e-45e3-8c59-426366278b9d`

---

## 步骤 3：构建 DApp 组件

创建 `src/components/AttestationWidget.tsx`：

```typescript
import { useState } from 'react';
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // 替换为你的模板 ID

export default function AttestationWidget() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // 步骤 1: 连接钱包
  const connectWallet = async () => {
    setLoading(true);
    setError('');
    try {
      if (!window.ethereum) throw new Error('MetaMask 未安装');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // 切换到 Base Sepolia
      try {
        await provider.send("wallet_switchEthereumChain", [
          { chainId: "0x" + (84532).toString(16) }
        ]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0x" + (84532).toString(16),
            chainName: "Base Sepolia",
            rpcUrls: ["https://sepolia.base.org"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.basescan.org"]
          }]);
        }
      }
      
      setStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 步骤 2: 提交任务
  const submitTask = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      const submitResult = await primusNetwork.submitTask({
        templateId: TEMPLATE_ID,
        address
      });
      
      setResult({ submitResult });
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 步骤 3: 执行证明
  const executeAttestation = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      const attestResult = await primusNetwork.attest({
        templateId: TEMPLATE_ID,
        address,
        ...(result as any).submitResult
      });
      
      setResult({ ...(result as any), attestResult });
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 步骤 4: 轮询结果
  const pollResult = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const primusNetwork = new PrimusNetwork();
      await primusNetwork.init(signer, 84532);
      
      const taskResult = await primusNetwork.verifyAndPollTaskResult({
        taskId: (result as any).attestResult[0].taskId,
        reportTxHash: (result as any).attestResult[0].reportTxHash,
        intervalMs: 2000,
        timeoutMs: 120000
      });
      
      setResult({ ...(result as any), taskResult });
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔐 Primus 证明 DApp</h2>
      
      {/* 进度步骤 */}
      <div style={{ marginBottom: '20px' }}>
        {['连接钱包', '提交任务', '执行证明', '获取结果'].map((s, i) => (
          <span key={s} style={{ 
            marginRight: '10px',
            color: i <= step ? '#4caf50' : '#ccc',
            fontWeight: i === step ? 'bold' : 'normal'
          }}>
            {i + 1}. {s} {i < 3 ? '→' : ''}
          </span>
        ))}
      </div>
      
      {/* 操作按钮 */}
      <div>
        {step === 0 && (
          <button onClick={connectWallet} disabled={loading}>
            {loading ? '连接中...' : '🔗 连接钱包'}
          </button>
        )}
        {step === 1 && (
          <button onClick={submitTask} disabled={loading}>
            {loading ? '提交中...' : '📝 提交证明任务'}
          </button>
        )}
        {step === 2 && (
          <button onClick={executeAttestation} disabled={loading}>
            {loading ? '证明中...' : '✅ 执行 zkTLS 证明'}
          </button>
        )}
        {step === 3 && (
          <button onClick={pollResult} disabled={loading}>
            {loading ? '查询中...' : '🔄 获取验证结果'}
          </button>
        )}
      </div>
      
      {/* 错误显示 */}
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          ❌ {error}
        </div>
      )}
      
      {/* 结果显示 */}
      {step === 4 && result && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
          <h3>✅ 验证完成！</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(result.taskResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## 步骤 4：在 DApp 中使用

更新 `src/App.tsx`：

```typescript
import AttestationWidget from './components/AttestationWidget';

function App() {
  return (
    <div>
      <AttestationWidget />
    </div>
  );
}

export default App;
```

---

## 步骤 5：运行 DApp

```bash
# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 然后：

1. **🔗 连接钱包** — 连接 MetaMask
2. **📝 提交任务** — 创建链上证明任务
3. **✅ 执行证明** — 浏览器执行 zkTLS 证明
4. **🔄 获取结果** — 查看验证数据

---

## 完整流程

```
用户浏览器
     │
     ▼
┌─────────────────┐
│  你的 DApp UI   │
│  (React/Vue)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ network-js-sdk  │
│  - init()       │
│  - submitTask() │
│  - attest()     │
│  - pollResult() │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌─────────────┐  ┌─────────────┐
│   MetaMask  │  │   Primus    │
│  (签名者)   │  │  浏览器扩展  │
│             │  │  (zkTLS)    │
└─────────────┘  └─────────────┘
         │              │
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │ Base 链     │
         │ (智能合约)   │
         └─────────────┘
```

---

## DApp 开发者常见问题

### 1. "MetaMask 未安装"
```typescript
if (!window.ethereum) {
  alert('请安装 MetaMask: https://metamask.io');
}
```

### 2. "网络不正确"
```typescript
// 自动切换到 Base Sepolia
await provider.send("wallet_switchEthereumChain", [
  { chainId: "0x" + (84532).toString(16) }
]);
```

### 3. "证明超时"
```typescript
// 生产环境增加超时时间
const result = await primusNetwork.verifyAndPollTaskResult({
  taskId,
  reportTxHash,
  timeoutMs: 180000 // 3 分钟
});
```

### 4. "Gas 不足"
- 用户钱包需要 ETH 作为 Gas
- 获取测试网 ETH: https://sepolia.basescan.org/faucet

---

## 下一步

- 阅读 [完整 API 参考](./API-REFERENCE-CN.md)
- 查看 [演示 DApp 代码](https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example)
- 在 [开发者平台](https://dev.primuslabs.xyz) 创建模板
- 加入 [Discord](https://discord.gg/primus) 获取支持

---

**需要帮助？** 访问 [Primus Discord](https://discord.gg/primus) 或提交 GitHub Issue
