import { browserPool } from "@/lib/BrowserPool";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { url, width, height, deviceScaleFactor } = await request.json();

  const page = await browserPool.requirePage();

  let image: Uint8Array;
  try {
    await page.setViewport({ width, height, deviceScaleFactor });

    await page.goto(url);
    await page.waitForNetworkIdle();

    image = await page.screenshot({
      type: "png",
      fullPage: false,
      encoding: "binary",
    });
  } finally {
    await browserPool.releasePage(page);
  }

  return new NextResponse(image, {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });
}
