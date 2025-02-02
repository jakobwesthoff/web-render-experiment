import puppeteer, { Browser, Page } from "puppeteer-core";
import { MutexCollection } from "./MutexCollection";
import { Lock } from "./Mutex";

class InnerLock implements Lock<Page> {
  public constructor(
    private pool: BrowserPool,
    private originalLock: Lock<Page>,
  ) {}

  public value(): Page {
    return this.originalLock.value();
  }

  public setValue(newValue: Page): Page {
    return this.originalLock.setValue(newValue);
  }

  public release(): void {
    // The release function is not async. We can not make it async easily.
    // However it is not problem, if the real release is happening a little
    // later, as all acquires are async. Therefore we simply call it in the
    // "background". However due to this fact, we can't handle errors. The
    // release needs to happen in the end no matter what. The goto of the page
    // here is not life critical for our application, therefore we ignore its
    // errors.
    // FIXME: See if release can be made async in the Mutex and
    // MutexCollection.
    (async () => {
      try {
        await this.originalLock.value().goto("about:blank");
      } finally {
        this.originalLock.release();
      }
    })();
  }
}

class BrowserPool {
  private browser: Browser | undefined;
  private pages: MutexCollection<Page> = new MutexCollection();
  private initialized: boolean = false;

  public constructor(private allocationCount: number = 4) {}

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // We directly set it to be initialized, because during the initialization
    // itself the MutexCollection will simply give out promises on locks, that
    // are fulfilled automatically as the pages become available. This actually
    // handles all the headaches about waiting until initialization is complete
    // for us.
    this.initialized = true;

    this.browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      headless: true,
      args: ["--no-sandbox"],
    });

    for (let i = 0; i < this.allocationCount; i++) {
      this.pages.add(await this.browser.newPage());
    }
  }

  public async acquire(): Promise<Lock<Page>> {
    this.ensureInitialized();
    return new InnerLock(this, await this.pages.acquire());
  }
}

export const browserPool = new BrowserPool();
