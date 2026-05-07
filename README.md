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

To enable collecting from the site, set the deployed contract address before starting Next.js:

```bash
NEXT_PUBLIC_TOOL_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_MAINNET_RPC_URL=https://your-mainnet-rpc.example
NEXT_PUBLIC_APP_URL=https://your-production-domain.example
```

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is required for Rainbow and WalletConnect. MetaMask/injected wallets also flow through RainbowKit after this change.
`NEXT_PUBLIC_MAINNET_RPC_URL` is optional, but recommended if you want the sale stats to read from your preferred Ethereum RPC instead of public fallback endpoints.
`NEXT_PUBLIC_APP_URL` is used for Mini App metadata, manifests, and wallet app metadata. It defaults to `https://www.boxes.tools` and is normalized without a trailing slash.

### Farcaster Mini App

This app includes Farcaster Mini App support as an adaptation layer around the existing website.

The root page emits an `fc:miniapp` meta tag. The manifest endpoint is available at `/.well-known/farcaster.json`. Before signing, it returns HTTP 200 with an unsigned `miniapp` scaffold so Farcaster Developer Tools can fetch it. After signing, set `FARCASTER_ACCOUNT_ASSOCIATION_JSON` and the route will include the real top-level `accountAssociation`.

Do not deploy a placeholder or fake `accountAssociation`. Generate the signed object in Farcaster Developer Tools for the exact production domain, including subdomain, then set it as JSON:

```bash
FARCASTER_ACCOUNT_ASSOCIATION_JSON='{"header":"...","payload":"...","signature":"..."}'
```

An example manifest shape lives at `docs/farcaster-example-manifest.json`.

After deployment, verify:

```bash
curl -s https://YOUR_DOMAIN/.well-known/farcaster.json | jq .
curl -s https://YOUR_DOMAIN | grep 'fc:miniapp'
```

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
