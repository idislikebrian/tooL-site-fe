import { NextResponse } from "next/server";

import { MINIAPP_MANIFEST_CONFIG } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

function parseAccountAssociation() {
  const raw = process.env.FARCASTER_ACCOUNT_ASSOCIATION_JSON;
  if (!raw) {
    return null;
  }

  try {
    const association = JSON.parse(raw);
    if (
      typeof association?.header === "string" &&
      typeof association?.payload === "string" &&
      typeof association?.signature === "string"
    ) {
      return association;
    }
  } catch {
    return null;
  }

  return null;
}

export function GET() {
  const accountAssociation = parseAccountAssociation();
  const manifest = {
    miniapp: MINIAPP_MANIFEST_CONFIG,
  };

  if (!accountAssociation) {
    return NextResponse.json(manifest);
  }

  return NextResponse.json({
    accountAssociation,
    ...manifest,
  });
}
