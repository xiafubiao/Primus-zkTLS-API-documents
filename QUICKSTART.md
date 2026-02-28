# Primus Network SDK 快速入门指南

5 分钟快速上手 Primus Network SDK，完成第一次 Attestation 任务。

---

## 前置条件

1. **安装 MetaMask** 浏览器扩展
2. **安装 Primus Extension** [从 Chrome 商店下载](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (版本 ≥ 0.3.44)
3. **准备测试网 ETH** - 从 [Base Sepolia Faucet](https://sepolia.basescan.org/faucet) 获取

---

## 步骤 1：创建项目

```bash
# 创建新项目
mkdir my-primus-app
cd my-primus-app

# 初始化 npm 项目
npm init -y

# 安装依赖
npm install @primuslabs/network-js-sdk ethers@5
```

---

## 步骤 2：创建模板

在编写代码之前，需要先在 Primus 开发者平台创建模板：

1. 访问 [Primus Developer Hub](https://dev.primuslabs.xyz/myDevelopment/myTemplates/new)
2. 登录并创建新模板
3. 配置模板参数（如要验证的数据字段、API 端点等）
4. **保存 Template ID** - 后续代码中需要用到

示例模板配置：
- **Template Name:** X Account Ownership
- **Template ID:** `2e3160ae-8b1e-45e3-8c59-426366278b9d` (示例)

---

## 步骤 3：编写代码

创建 `index.html`：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Primus Network SDK Demo</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    button { padding: 12px 24px; font-size: 16px; margin: 10px 0; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
    .info { background: #d1ecf1; color: #0c5460; }
    pre { background: #f4f4f4; padding: 15px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>🔐 Primus Network SDK Demo</h1>
  
  <div id="status" class="status info">准备就绪</div>
  
  <button id="connectBtn" onclick="connectWallet()">🔗 连接钱包</button>
  <button id="submitBtn" onclick="submitTask()" disabled>📝 提交任务</button>
  <button id="attestBtn" onclick="attestTask()" disabled>✅ 执行 Attestation</button>
  <button id="pollBtn" onclick="pollResult()" disabled>🔄 查询结果</button>
  
  <h3>📊 结果:</h3>
  <pre id="output">等待操作...</pre>

  <script type="module">
    import { PrimusNetwork } from "@primuslabs/network-js-sdk";
    import { ethers } from "ethers";

    const CHAINID = 84532; // Base Sepolia
    const TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // 替换为你的模板 ID
    
    let primusNetwork;
    let signer;
    let userAddress;
    let submitTaskResult;
    let attestResult;

    window.connectWallet = async () => {
      try {
        updateStatus("连接钱包中...", "info");
        
        // 连接 MetaMask
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // 切换网络
        try {
          await provider.send("wallet_switchEthereumChain", [
            { chainId: "0x" + CHAINID.toString(16) }
          ]);
        } catch (switchError) {
          if (switchError.code === 4902) {
            await provider.send("wallet_addEthereumChain", [{
              chainId: "0x" + CHAINID.toString(16),
              chainName: "Base Sepolia",
              rpcUrls: ["https://sepolia.base.org"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.basescan.org"]
            }]);
          }
        }
        
        // 初始化 SDK
        primusNetwork = new PrimusNetwork();
        await primusNetwork.init(signer, CHAINID);
        
        updateStatus(`✅ 钱包已连接：${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`, "success");
        document.getElementById('submitBtn').disabled = false;
        
      } catch (error) {
        updateStatus(`❌ 错误：${error.message}`, "error");
      }
    };

    window.submitTask = async () => {
      try {
        updateStatus("📝 提交任务中...", "info");
        document.getElementById('submitBtn').disabled = true;
        
        submitTaskResult = await primusNetwork.submitTask({
          templateId: TEMPLATE_ID,
          address: userAddress
        });
        
        output(`任务提交成功!\n任务 ID: ${submitTaskResult.taskId}\n交易哈希：${submitTaskResult.taskTxHash}\nAttestors: ${submitTaskResult.taskAttestors.join(', ')}`);
        updateStatus("✅ 任务已提交", "success");
        document.getElementById('attestBtn').disabled = false;
        
      } catch (error) {
        updateStatus(`❌ 错误：${error.message}`, "error");
        document.getElementById('submitBtn').disabled = false;
      }
    };

    window.attestTask = async () => {
      try {
        updateStatus("✅ 执行 Attestation 中...", "info");
        document.getElementById('attestBtn').disabled = true;
        
        attestResult = await primusNetwork.attest({
          templateId: TEMPLATE_ID,
          address: userAddress,
          ...submitTaskResult
        });
        
        output(`Attestation 完成!\nAttestor: ${attestResult[0].attestor}\n报告哈希：${attestResult[0].reportTxHash}`);
        updateStatus("✅ Attestation 已完成", "success");
        document.getElementById('pollBtn').disabled = false;
        
      } catch (error) {
        updateStatus(`❌ 错误：${error.message}`, "error");
        document.getElementById('attestBtn').disabled = false;
      }
    };

    window.pollResult = async () => {
      try {
        updateStatus("🔄 查询结果中...", "info");
        document.getElementById('pollBtn').disabled = true;
        
        const taskResult = await primusNetwork.verifyAndPollTaskResult({
          taskId: attestResult[0].taskId,
          reportTxHash: attestResult[0].reportTxHash,
          intervalMs: 2000,
          timeoutMs: 120000
        });
        
        output(`任务完成!\n状态：SUCCESS\n数据：${JSON.stringify(taskResult, null, 2)}`);
        updateStatus("✅ 任务已完成", "success");
        
      } catch (error) {
        updateStatus(`❌ 错误：${error.message}`, "error");
        document.getElementById('pollBtn').disabled = false;
      }
    };

    function updateStatus(message, type) {
      const statusEl = document.getElementById('status');
      statusEl.textContent = message;
      statusEl.className = `status ${type}`;
    }

    function output(text) {
      document.getElementById('output').textContent = text;
    }
  </script>
</body>
</html>
```

---

## 步骤 4：运行应用

使用 Vite 快速启动开发服务器：

```bash
# 安装 Vite
npm install -D vite

# 启动开发服务器
npx vite
```

浏览器访问 `http://localhost:5173`，然后：

1. 点击 **"🔗 连接钱包"** - 授权 MetaMask 访问
2. 点击 **"📝 提交任务"** - 提交 Attestation 任务
3. 点击 **"✅ 执行 Attestation"** - 执行验证
4. 点击 **"🔄 查询结果"** - 获取最终结果

---

## 完整流程说明

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  连接钱包   │ ──► │  提交任务   │ ──► │ 执行 Attest │ ──► │  查询结果   │
│  Initialize │     │ submitTask  │     │   attest    │     │ pollResult  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
  获取地址            创建任务            节点验证            获取结果
  切换网络           分配 Attestor      提交报告            解析数据
```

---

## 常见问题

### 1. "MetaMask not detected"
- 确保已安装 MetaMask 扩展
- 刷新页面重试

### 2. "chainId is not supported"
- 确保使用支持的网络（84532 或 8453）
- 检查钱包是否已切换到正确网络

### 3. 交易失败/Gas 不足
- 确保钱包有足够的测试网 ETH
- 从 [Base Sepolia Faucet](https://sepolia.basescan.org/faucet) 获取

### 4. Attestation 超时
- 增加 `timeoutMs` 参数
- 检查网络连接
- 确认模板配置正确

---

## 下一步

- 阅读 [完整 API 文档](./API-REFERENCE.md)
- 查看 [示例代码](https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example)
- 在 [开发者平台](https://dev.primuslabs.xyz) 创建更多模板

---

**需要帮助？** 访问 [Primus Discord](https://discord.gg/primus) 或提交 GitHub Issue
