import { createDeferred, Deferred } from "./Deferred";
import { Lock, Mutex } from "./Mutex";

class InnerLock<T> implements Lock<T> {
  public constructor(
    private mutex: MutexCollection<T>,
    private originalLock: Lock<T>,
  ) {}

  public value(): T {
    return this.originalLock.value();
  }

  public setValue(newValue: T): T {
    return this.originalLock.setValue(newValue);
  }

  public release(): void {
    this.originalLock.release();
    this.mutex[ProcessQueueSymbol]();
  }
}

const ProcessQueueSymbol = Symbol("ProcessQueue");

export class MutexCollection<T> {
  private collection: Mutex<T>[] = [];
  private queue: Deferred<Lock<T>>[] = [];

  public constructor() {}

  public add(item: T) {
    this.collection.push(new Mutex(item));
    this[ProcessQueueSymbol]();
  }

  public size(): number {
    return this.collection.length;
  }

  private findFirstReleasedItem(): Mutex<T> | false {
    const releasedItems = this.collection.filter(
      (candidate) => !candidate.isAcquired(),
    );
    if (releasedItems.length === 0) {
      return false;
    }

    return releasedItems[0];
  }

  public [ProcessQueueSymbol]() {
    if (this.queue.length === 0) {
      return;
    }

    const releasedItem = this.findFirstReleasedItem();
    if (!releasedItem) {
      return;
    }

    const q = this.queue.shift()!;
    // This might race with another acquire call. We need to be aware of that.
    // It should usally not happen, but it could. Therefore We are moving this
    // operation to the "background". Furthermore we are removing the queue
    // entry, before doing so, in order to be sure we are trying to acquire
    // more mutexes than we actually need due to races.
    releasedItem.acquire().then((lock) => {
      q.resolve(new InnerLock(this, lock));
    });

    setImmediate(() => this[ProcessQueueSymbol]());
  }

  public async acquire(): Promise<Lock<T>> {
    const deferred = createDeferred<Lock<T>>();
    this.queue.push(deferred);
    this[ProcessQueueSymbol]();
    return deferred.promise;
  }
}
