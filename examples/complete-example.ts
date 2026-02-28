/**
 * Primus Network SDK 完整示例
 * 
 * 这个示例展示了如何使用 Primus Network SDK 完成完整的 Attestation 流程
 * 包括：初始化、提交任务、执行 Attestation、轮询结果
 * 
 * 运行方式：
 * 1. 在浏览器环境中运行（需要 MetaMask）
 * 2. 或使用 Node.js + 本地节点
 */

import { PrimusNetwork, TokenSymbol } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

// ==================== 配置 ====================

const CONFIG = {
  // 链 ID: 84532 (Base Sepolia 测试网) 或 8453 (Base 主网)
  CHAIN_ID: 84532,
  
  // 模板 ID - 在 https://dev.primuslabs.xyz 创建
  TEMPLATE_ID: "YOUR_TEMPLATE_ID",
  
  // 轮询配置
  POLL_INTERVAL_MS: 2000,
  POLL_TIMEOUT_MS: 120000, // 2 分钟
};

// ==================== 初始化 ====================

/**
 * 连接钱包并初始化 SDK
 */
async function connectAndInitialize(): Promise<{
  primusNetwork: PrimusNetwork;
  signer: ethers.Signer;
  address: string;
}> {
  console.log("🔗 连接钱包...");
  
  // 检查 MetaMask
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask 未安装，请安装 https://metamask.io");
  }
  
  // 创建提供者
  const provider = new ethers.providers.Web3Provider((window as any).ethereum);
  
  // 请求账户访问
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  
  console.log(`✅ 钱包已连接：${address}`);
  
  // 检查/切换网络
  const network = await provider.getNetwork();
  if (network.chainId !== CONFIG.CHAIN_ID) {
    console.log(`🔄 切换到链 ID: ${CONFIG.CHAIN_ID}`);
    
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: "0x" + CONFIG.CHAIN_ID.toString(16) }
      ]);
    } catch (switchError: any) {
      // 如果网络不存在，添加网络
      if (switchError.code === 4902) {
        const chainConfigs: Record<number, any> = {
          84532: {
            chainName: "Base Sepolia",
            rpcUrls: ["https://sepolia.base.org"],
            blockExplorerUrls: ["https://sepolia.basescan.org"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
          },
          8453: {
            chainName: "Base",
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }
          }
        };
        
        const config = chainConfigs[CONFIG.CHAIN_ID];
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: "0x" + CONFIG.CHAIN_ID.toString(16),
            ...config
          }
        ]);
      } else {
        throw switchError;
      }
    }
  }
  
  // 初始化 SDK
  console.log("🚀 初始化 SDK...");
  const primusNetwork = new PrimusNetwork();
  await primusNetwork.init(signer, CONFIG.CHAIN_ID);
  
  console.log("✅ SDK 初始化成功");
  console.log(`📡 支持的网络：${primusNetwork.supportedChainIds.join(", ")}`);
  
  return { primusNetwork, signer, address };
}

// ==================== 核心功能 ====================

/**
 * 步骤 1: 提交任务
 */
async function submitTask(
  primusNetwork: PrimusNetwork,
  templateId: string,
  address: string
) {
  console.log("\n📝 提交任务...");
  
  const submitTaskParams = {
    templateId,
    address
  };
  
  const result = await primusNetwork.submitTask(submitTaskParams);
  
  console.log("✅ 任务提交成功!");
  console.log(`   任务 ID: ${result.taskId}`);
  console.log(`   交易哈希：${result.taskTxHash}`);
  console.log(`   Attestors: ${result.taskAttestors.join(", ")}`);
  console.log(`   提交时间：${new Date(result.submittedAt * 1000).toISOString()}`);
  
  return result;
}

/**
 * 步骤 2: 执行 Attestation
 */
async function executeAttestation(
  primusNetwork: PrimusNetwork,
  templateId: string,
  address: string,
  submitTaskResult: any
) {
  console.log("\n✅ 执行 Attestation...");
  
  const attestParams = {
    templateId,
    address,
    ...submitTaskResult,
    // 可选参数
    // extendedParams: JSON.stringify({ 
    //   attUrlOptimization: true  // 优化 Attestation URL
    // }),
    // allJsonResponseFlag: 'true' as const,  // 获取完整 HTTP 响应
  };
  
  const result = await primusNetwork.attest(attestParams);
  
  console.log("✅ Attestation 完成!");
  console.log(`   结果数量：${result.length}`);
  
  result.forEach((item: any, index: number) => {
    console.log(`\n   --- Attestor ${index + 1} ---`);
    console.log(`   Attestor: ${item.attestor}`);
    console.log(`   URL: ${item.attestorUrl}`);
    console.log(`   报告哈希：${item.reportTxHash}`);
    console.log(`   时间：${new Date(item.attestationTime as number * 1000).toISOString()}`);
  });
  
  return result;
}

/**
 * 步骤 3: 轮询任务结果
 */
async function pollTaskResult(
  primusNetwork: PrimusNetwork,
  taskId: string,
  reportTxHash: string
) {
  console.log("\n🔄 轮询任务结果...");
  
  const result = await primusNetwork.verifyAndPollTaskResult({
    taskId,
    reportTxHash,
    intervalMs: CONFIG.POLL_INTERVAL_MS,
    timeoutMs: CONFIG.POLL_TIMEOUT_MS
  });
  
  console.log("✅ 任务完成!");
  console.log(`   结果数量：${result.length}`);
  
  result.forEach((item: any, index: number) => {
    console.log(`\n   --- 结果 ${index + 1} ---`);
    console.log(`   任务 ID: ${item.taskId}`);
    console.log(`   Attestor: ${item.attestor}`);
    console.log(`   数据：${item.attestation.data}`);
  });
  
  return result;
}

/**
 * (可选) 步骤 4: 提取奖励
 */
async function withdrawBalance(primusNetwork: PrimusNetwork) {
  console.log("\n💰 提取奖励...");
  
  try {
    const settledTaskIds = await primusNetwork.withdrawBalance(TokenSymbol.ETH, 100);
    
    console.log("✅ 奖励提取成功!");
    console.log(`   已结算任务数：${settledTaskIds.length}`);
    console.log(`   任务 ID: ${settledTaskIds.slice(0, 5).join(", ")}${settledTaskIds.length > 5 ? "..." : ""}`);
    
    return settledTaskIds;
  } catch (error: any) {
    console.log("⚠️ 提取失败或无可提取奖励");
    console.log(`   错误：${error.message}`);
    return [];
  }
}

/**
 * (可选) 获取完整 HTTP 响应
 */
function getFullResponse(primusNetwork: PrimusNetwork, taskId: string) {
  console.log("\n📄 获取完整 HTTP 响应...");
  
  const jsonResponse = primusNetwork.getAllJsonResponse(taskId);
  
  if (jsonResponse) {
    const data = JSON.parse(jsonResponse);
    console.log("✅ 完整响应:", JSON.stringify(data, null, 2));
    return data;
  } else {
    console.log("⚠️ 无完整响应数据（需要在 attest 时设置 allJsonResponseFlag: 'true'）");
    return null;
  }
}

// ==================== 主流程 ====================

/**
 * 完整的 Attestation 流程
 */
async function main() {
  console.log("🚀 Primus Network SDK 完整示例\n");
  console.log("=" .repeat(50));
  
  try {
    // 0. 连接并初始化
    const { primusNetwork, signer, address } = await connectAndInitialize();
    
    // 1. 提交任务
    const submitTaskResult = await submitTask(
      primusNetwork,
      CONFIG.TEMPLATE_ID,
      address
    );
    
    // 2. 执行 Attestation
    const attestResult = await executeAttestation(
      primusNetwork,
      CONFIG.TEMPLATE_ID,
      address,
      submitTaskResult
    );
    
    // 3. 轮询结果
    const taskResult = await pollTaskResult(
      primusNetwork,
      attestResult[0].taskId,
      attestResult[0].reportTxHash
    );
    
    // 4. (可选) 获取完整响应
    // getFullResponse(primusNetwork, attestResult[0].taskId);
    
    // 5. (可选) 提取奖励
    // await withdrawBalance(primusNetwork);
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ 完整流程完成!");
    console.log("=" .repeat(50));
    
    return {
      submitTaskResult,
      attestResult,
      taskResult
    };
    
  } catch (error: any) {
    console.error("\n❌ 流程失败:", error.message);
    console.error(error);
    throw error;
  }
}

// ==================== 运行 ====================

// 在浏览器中运行
if (typeof window !== "undefined") {
  (window as any).runPrimusExample = main;
  console.log("📖 在浏览器控制台调用 runPrimusExample() 开始");
}

// 在 Node.js 中运行（需要额外配置）
// main();

export { main, connectAndInitialize, submitTask, executeAttestation, pollTaskResult };
