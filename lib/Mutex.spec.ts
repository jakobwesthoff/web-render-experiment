import { Mutex } from "./Mutex";

describe("Mutex", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should be instantiable", () => {
    const mutex = new Mutex(423);
    expect(mutex).toBeInstanceOf(Mutex);
  });

  it("should make acquire calls wait, while still locked", async () => {
    const value: any = { called: [] };
    const mutex = new Mutex(value);
    const lockOne = await mutex.acquire();
    lockOne.value().called.push("lockOne-1");
    setTimeout(async () => {
      const lockTwo = await mutex.acquire();
      lockTwo.value().called.push("lockTwo-1");
      lockTwo.release();
    }, 100);

    setTimeout(() => {
      lockOne.value().called.push("lockOne-2");
      lockOne.release();
    }, 1000);

    let lastTimeoutRan = false;
    setTimeout(async () => {
      const lockThree = await mutex.acquire();
      expect(lockThree.value().called).toEqual([
        "lockOne-1",
        "lockOne-2",
        "lockTwo-1",
      ]);
      lockThree.release();
      lastTimeoutRan = true;
    }, 2000);

    await jest.runAllTimersAsync();
    expect(lastTimeoutRan).toBeTruthy();
  });
});
