import { mainnet } from "viem/chains";

export const TOOL_CHAIN = mainnet;

export const TOOL_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TOOL_CONTRACT_ADDRESS || "";

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

export const MAINNET_RPC_URLS = [
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
  "https://ethereum-rpc.publicnode.com",
  "https://eth.llamarpc.com",
  "https://cloudflare-eth.com",
].filter(Boolean);

export const TOOL_ABI = [
  {
    type: "function",
    name: "mintNext",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "PUBLIC_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "MINT_PRICE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "START_TIME",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "FREE_DURATION",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
];

export function getContractUrl() {
  if (!TOOL_CONTRACT_ADDRESS) {
    return "https://etherscan.io";
  }

  return `https://etherscan.io/address/${TOOL_CONTRACT_ADDRESS}`;
}
