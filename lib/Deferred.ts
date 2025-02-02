export type Deferred<T> = {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: any): void;
};

export function createDeferred<T>() {
  const deferred: Partial<Deferred<T>> = {
    promise: undefined,
    resolve: undefined,
    reject: undefined,
  };

  const promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  deferred.promise = promise;

  return deferred as Deferred<T>;
}
