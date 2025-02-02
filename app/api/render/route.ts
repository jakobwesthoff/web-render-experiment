import { browserPool } from "@/lib/BrowserPool";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { url, width, height, deviceScaleFactor } = await request.json();

  const page = await browserPool.acquire();

  let image: Uint8Array;
  try {
    await page.value().setViewport({ width, height, deviceScaleFactor });

    await page.value().goto(url);
    await page.value().waitForNetworkIdle();

    image = await page.value().screenshot({
      type: "png",
      fullPage: false,
      encoding: "binary",
    });
  } finally {
    page.release();
  }

  return new NextResponse(image, {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });
}
