import puppeteer, { Browser, Page } from "puppeteer-core";

class BrowserPool {
  private browser: Browser | undefined;
  private releasedPages: Page[] = [];
  private requiredPages: Page[] = [];

  // FIXME: Implement Queue and maxPage allocation

  public constructor() {}

  private async getBrowser(): Promise<Browser> {
    if (this.browser !== undefined) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      headless: true,
      args: ["--no-sandbox"],
    });

    return this.browser;
  }

  public async requirePage(): Promise<Page> {
    if (this.releasedPages.length > 0) {
      const page = this.releasedPages.pop()!;
      this.requiredPages.push(page);
      return page;
    }

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    this.requiredPages.push(page);
    return page;
  }

  public async releasePage(page: Page): Promise<void> {
    const requiredIndex = this.requiredPages.indexOf(page);
    if (requiredIndex === -1) {
      throw new Error(`Unknown page was given for release.`);
    }

    this.requiredPages.splice(requiredIndex, 1);

    await page.goto("about:blank");

    this.releasedPages.push(page);
  }
}

export const browserPool = new BrowserPool();
