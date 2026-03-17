import { createPublicClient, fallback, http } from "viem";

import {
  MAINNET_RPC_URLS,
  TOOL_CHAIN,
  TOOL_CONTRACT_ADDRESS,
} from "@/lib/toolContract";

const ALCHEMY_BASE_URL = `https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}`;
const ensClient = createPublicClient({
  chain: TOOL_CHAIN,
  transport: fallback(MAINNET_RPC_URLS.map((url) => http(url))),
});

function normalizeTokenId(tokenId) {
  if (!tokenId) {
    return "";
  }

  if (tokenId.startsWith("0x")) {
    return BigInt(tokenId).toString(10);
  }

  return tokenId;
}

function pickImage(nft) {
  return (
    nft.image?.cachedUrl ||
    nft.image?.pngUrl ||
    nft.image?.thumbnailUrl ||
    nft.image?.originalUrl ||
    null
  );
}

function normalizeNft(nft) {
  return {
    tokenId: normalizeTokenId(nft.tokenId),
    name: nft.name || `tooLbox #${normalizeTokenId(nft.tokenId)}`,
    description: nft.description || "",
    image: pickImage(nft),
  };
}

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function getContractOwners() {
  const url = new URL(`${ALCHEMY_BASE_URL}/getOwnersForContract`);
  url.searchParams.set("contractAddress", TOOL_CONTRACT_ADDRESS);
  url.searchParams.set("withTokenBalances", "true");

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Alchemy request failed with ${response.status}.`);
  }

  const data = await response.json();
  return data.owners || [];
}

async function buildOwnerMaps(owners) {
  const ownerByTokenId = new Map();
  const uniqueAddresses = [...new Set(owners.map((owner) => owner.ownerAddress))];

  owners.forEach((owner) => {
    (owner.tokenBalances || []).forEach((tokenBalance) => {
      ownerByTokenId.set(normalizeTokenId(tokenBalance.tokenId), owner.ownerAddress);
    });
  });

  const ensEntries = await Promise.all(
    uniqueAddresses.map(async (address) => {
      try {
        const ensName = await ensClient.getEnsName({ address });
        return [address, ensName || formatAddress(address)];
      } catch {
        return [address, formatAddress(address)];
      }
    }),
  );

  return {
    ownerByTokenId,
    ownerLabelByAddress: new Map(ensEntries),
  };
}

export async function getOwnedToolboxes(owner) {
  if (!process.env.ALCHEMY_API_KEY) {
    throw new Error("Missing ALCHEMY_API_KEY.");
  }

  const url = new URL(`${ALCHEMY_BASE_URL}/getNFTsForOwner`);
  url.searchParams.set("owner", owner);
  url.searchParams.append("contractAddresses[]", TOOL_CONTRACT_ADDRESS);
  url.searchParams.set("withMetadata", "true");
  url.searchParams.set("pageSize", "100");

  const response = await fetch(url, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Alchemy request failed with ${response.status}.`);
  }

  const data = await response.json();

  return (data.ownedNfts || []).map(normalizeNft);
}

export async function getContractToolboxes() {
  if (!process.env.ALCHEMY_API_KEY) {
    throw new Error("Missing ALCHEMY_API_KEY.");
  }

  const toolboxes = [];
  let pageKey = null;

  do {
    const url = new URL(`${ALCHEMY_BASE_URL}/getNFTsForContract`);
    url.searchParams.set("contractAddress", TOOL_CONTRACT_ADDRESS);
    url.searchParams.set("withMetadata", "true");
    url.searchParams.set("pageSize", "100");

    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Alchemy request failed with ${response.status}.`);
    }

    const data = await response.json();
    toolboxes.push(...(data.nfts || []).map(normalizeNft));
    pageKey = data.pageKey || null;
  } while (pageKey);

  const owners = await getContractOwners();
  const { ownerByTokenId, ownerLabelByAddress } = await buildOwnerMaps(owners);

  return toolboxes.sort(
    (a, b) => Number.parseInt(a.tokenId, 10) - Number.parseInt(b.tokenId, 10),
  ).map((toolbox) => {
    const ownerAddress = ownerByTokenId.get(toolbox.tokenId) || "";

    return {
      ...toolbox,
      ownerAddress,
      ownerLabel: ownerAddress
        ? ownerLabelByAddress.get(ownerAddress) || formatAddress(ownerAddress)
        : "",
    };
  });
}
