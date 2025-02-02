import { createDeferred } from "./Deferred";
import { type Lock } from "./Mutex";
import { MutexCollection } from "./MutexCollection";

describe("MutexCollection", () => {
  it("should be instantiable", () => {
    const collection = new MutexCollection();
    expect(collection).toBeInstanceOf(MutexCollection);
  });

  it("should be able to take on items", () => {
    const itemOne = "item-1";
    const itemTwo = "item-2";
    const collection = new MutexCollection<string>();
    expect(collection.size()).toEqual(0);
    collection.add(itemOne);
    expect(collection.size()).toEqual(1);
    collection.add(itemTwo);
    expect(collection.size()).toEqual(2);
  });

  it("should acquire one available item", async () => {
    const itemOne = "item-1";
    const collection = new MutexCollection<string>();
    collection.add(itemOne);
    const lock = await collection.acquire();
    expect(lock.value()).toEqual(itemOne);
    lock.release();
  });

  it("should acquire one available item and wait until released", async () => {
    const itemOne = "item-1";
    const collection = new MutexCollection<string>();
    collection.add(itemOne);
    const deferred = createDeferred<void>();
    let lockOne: Lock<string> | undefined;
    let lockTwo: Lock<string> | undefined;

    setImmediate(async () => {
      lockOne = await collection.acquire();
      expect(lockOne.value()).toEqual(itemOne);
    });

    setImmediate(async () => {
      lockTwo = await collection.acquire();
    });

    setImmediate(async () => {
      expect(lockTwo).toBeUndefined();
    });

    setImmediate(async () => {
      lockOne!.release();
    });

    setImmediate(() => {
      expect(lockTwo!.value()).toEqual(itemOne);
    });

    setImmediate(() => {
      lockOne!.release();
      lockTwo!.release();
      deferred.resolve();
    });

    await deferred.promise;
  });

  it("should give out first released item after waiting", async () => {
    const itemOne = "item-1";
    const itemTwo = "item-2";
    const collection = new MutexCollection<string>();
    collection.add(itemOne);
    collection.add(itemTwo);
    const deferred = createDeferred<void>();
    let lockOne: Lock<string> | undefined;
    let lockTwo: Lock<string> | undefined;
    let lockThree: Lock<string> | undefined;
    let lockFour: Lock<string> | undefined;

    setImmediate(async () => {
      lockOne = await collection.acquire();
      expect(lockOne.value()).toEqual(itemOne);
      lockTwo = await collection.acquire();
      expect(lockTwo.value()).toEqual(itemTwo);
    });

    setImmediate(() => {
      lockTwo!.release();
    });

    setImmediate(async () => {
      lockThree = await collection.acquire();
      expect(lockThree.value()).toEqual(itemTwo);
    });

    setImmediate(async () => {
      lockFour = await collection.acquire();
    });

    setImmediate(async () => {
      expect(lockFour).toBeUndefined();
    });

    setImmediate(async () => {
      lockOne!.release();
    });

    setImmediate(() => {
      expect(lockFour!.value()).toEqual(itemOne);
    });

    setImmediate(() => {
      lockOne!.release();
      lockTwo!.release();
      lockThree!.release();
      lockFour!.release();
      deferred.resolve();
    });

    await deferred.promise;
  });

  it("should give out newly added item to waiting", async () => {
    const itemOne = "item-1";
    const itemTwo = "item-2";
    const collection = new MutexCollection<string>();
    collection.add(itemOne);
    const deferred = createDeferred<void>();
    let lockOne: Lock<string> | undefined;
    let lockTwo: Lock<string> | undefined;

    setImmediate(async () => {
      lockOne = await collection.acquire();
      expect(lockOne.value()).toEqual(itemOne);
      lockTwo = await collection.acquire();
    });

    setImmediate(() => {
      expect(lockTwo).toBeUndefined;
    });

    setImmediate(() => {
      collection.add(itemTwo);
    });

    setImmediate(() => {
      expect(lockTwo).not.toBeUndefined();
      expect(lockTwo!.value()).toEqual(itemTwo);
    });

    setImmediate(() => {
      lockOne!.release();
      lockTwo!.release();
      deferred.resolve();
    });

    await deferred.promise;
  });
});
