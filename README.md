# tooL.sol

tooL is a collection of 888 onchain toolkits.

Forked from the original Loot contract, tooL extends the idea of randomized, fully onchain primitives from fantasy gear to tools for building—physical, digital, creative, and conceptual.

No stats.  
No instructions.  
No prescribed use.

Just tools.

---

## Tech

- Next.js (App Router)
- CSS Modules
- Fully onchain SVG + metadata (contract-side)
- Minimal frontend for viewing and context

---

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

To enable minting from the site, set the deployed contract address before starting Next.js:

```bash
NEXT_PUBLIC_TOOL_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_MAINNET_RPC_URL=https://your-mainnet-rpc.example
```

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is required for Rainbow and WalletConnect. MetaMask/injected wallets also flow through RainbowKit after this change.
`NEXT_PUBLIC_MAINNET_RPC_URL` is optional, but recommended if you want the sale stats to read from your preferred Ethereum RPC instead of public fallback endpoints.

---

## Structure

* `src/app` — routes (Home, FAQ, Resources)
* `src/components` — shared UI
* `src/styles` — global styles
* Contract logic lives separately from this repo

---

## Philosophy

tooL intentionally avoids guidance, rarity frameworks, or gameplay mechanics at the base layer.

Meaning, value, and utility are expected to emerge downstream—through use, remixing, and interpretation.

---

## Funding

Created by Brian Felix in support of the $VROOM ecosystem.

---

## License / Usage

Use freely. Build freely. Interpret freely.
