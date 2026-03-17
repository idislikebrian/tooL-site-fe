import { NextResponse } from "next/server";

import { getOwnedToolboxes } from "@/lib/alchemy";

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (!owner || !isAddress(owner)) {
    return NextResponse.json(
      { error: "Valid owner address is required." },
      { status: 400 },
    );
  }

  try {
    const toolboxes = await getOwnedToolboxes(owner);
    return NextResponse.json({ toolboxes });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load toolboxes." },
      { status: 500 },
    );
  }
}
