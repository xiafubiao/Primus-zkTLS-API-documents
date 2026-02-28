# Primus network-js-sdk Quick Start

Get started with `@primuslabs/network-js-sdk` in 5 minutes and integrate zkTLS attestations into your DApp.

---

## Prerequisites

1. **MetaMask** browser extension installed
2. **Primus Extension** [Download](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) (version ≥ 0.3.44)
3. **Testnet ETH** — Get from [Base Sepolia Faucet](https://sepolia.basescan.org/faucet)

---

## Step 1: Create DApp Project

```bash
# Create new project
mkdir my-dapp-primus
cd my-dapp-primus

# Initialize with Vite (React template)
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install @primuslabs/network-js-sdk ethers@5
```

---

## Step 2: Create Template

Before coding, create an attestation template:

1. Visit [Primus Developer Hub](https://dev.primuslabs.xyz/myDevelopment/myTemplates/new)
2. Login and create a new template
3. Configure:
   - **API Endpoint** to verify
   - **Data Fields** to extract
   - **Verification Conditions**
4. **Save Template ID** — You'll need this in your DApp code

Example:
- **Template Name:** X Account Ownership
- **Template ID:** `2e3160ae-8b1e-45e3-8c59-426366278b9d`

---

## Step 3: Build DApp Component

Create `src/components/AttestationWidget.tsx`:

```typescript
import { useState } from 'react';
import { PrimusNetwork } from "@primuslabs/network-js-sdk";
import { ethers } from "ethers";

const TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // Replace with your template ID

export default function AttestationWidget() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Step 1: Connect Wallet
  const connectWallet = async () => {
    setLoading(true);
    setError('');
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // Switch to Base Sepolia
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

  // Step 2: Submit Task
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

  // Step 3: Execute Attestation
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

  // Step 4: Poll Result
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
      <h2>🔐 Primus Attestation DApp</h2>
      
      {/* Progress Steps */}
      <div style={{ marginBottom: '20px' }}>
        {['Connect Wallet', 'Submit Task', 'Attest', 'Get Result'].map((s, i) => (
          <span key={s} style={{ 
            marginRight: '10px',
            color: i <= step ? '#4caf50' : '#ccc',
            fontWeight: i === step ? 'bold' : 'normal'
          }}>
            {i + 1}. {s} {i < 3 ? '→' : ''}
          </span>
        ))}
      </div>
      
      {/* Action Buttons */}
      <div>
        {step === 0 && (
          <button onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : '🔗 Connect Wallet'}
          </button>
        )}
        {step === 1 && (
          <button onClick={submitTask} disabled={loading}>
            {loading ? 'Submitting...' : '📝 Submit Attestation Task'}
          </button>
        )}
        {step === 2 && (
          <button onClick={executeAttestation} disabled={loading}>
            {loading ? 'Attesting...' : '✅ Execute Attestation'}
          </button>
        )}
        {step === 3 && (
          <button onClick={pollResult} disabled={loading}>
            {loading ? 'Polling...' : '🔄 Get Verified Result'}
          </button>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          ❌ {error}
        </div>
      )}
      
      {/* Result Display */}
      {step === 4 && result && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
          <h3>✅ Verification Complete!</h3>
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

## Step 4: Use in Your DApp

Update `src/App.tsx`:

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

## Step 5: Run Your DApp

```bash
# Start development server
npm run dev
```

Open `http://localhost:5173` and:

1. **🔗 Connect Wallet** — Connect MetaMask
2. **📝 Submit Task** — Create attestation on-chain
3. **✅ Execute Attestation** — Browser performs zkTLS proof
4. **🔄 Get Result** — View verified data

---

## Complete Flow

```
User's Browser
     │
     ▼
┌─────────────────┐
│  Your DApp UI   │
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
│  (Signer)   │  │  Extension  │
│             │  │  (zkTLS)    │
└─────────────┘  └─────────────┘
         │              │
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │ Base Chain  │
         │ (Smart      │
         │  Contracts) │
         └─────────────┘
```

---

## FAQ for DApp Developers

### 1. "MetaMask not detected"
```typescript
if (!window.ethereum) {
  alert('Please install MetaMask: https://metamask.io');
}
```

### 2. "Wrong Network"
```typescript
// Auto-switch to Base Sepolia
await provider.send("wallet_switchEthereumChain", [
  { chainId: "0x" + (84532).toString(16) }
]);
```

### 3. "Attestation Timeout"
```typescript
// Increase timeout for production
const result = await primusNetwork.verifyAndPollTaskResult({
  taskId,
  reportTxHash,
  timeoutMs: 180000 // 3 minutes
});
```

### 4. "Insufficient Gas"
- User needs ETH for gas fees
- Get testnet ETH: https://sepolia.basescan.org/faucet

---

## Next Steps

- Read [Complete API Reference](./API-REFERENCE.md)
- Check [Demo DApp Code](https://github.com/primus-labs/zktls-demo/tree/main/network-sdk-example)
- Create templates at [Developer Platform](https://dev.primuslabs.xyz)
- Join [Discord](https://discord.gg/primus) for support

---

**Need Help?** Visit [Primus Discord](https://discord.gg/primus) or submit a GitHub Issue
