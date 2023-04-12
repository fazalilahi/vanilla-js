const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending',
};

class CustomPromise {
  #thenCbs = [];
  #catchCbs = [];
  #state = STATE.PENDING;
  #value;
  #onSuccessBind = this.#onSuccess.bind(this);
  #onFailBind = this.#onFail.bind(this);
  constructor(cb) {
    try {
      cb(this.#onSuccessBind, this.#onFailBind);
    } catch (e) {
      this.onFail(e);
    }
  }

  #runCbs() {
    if (this.#state === this.STATE.FULFILLED) {
      this.#thenCbs.forEach((cb) => {
        cb(this.#value);
      });
      this.#thenCbs = [];
    } else if (this.#state === this.STATE.REJECTED) {
      this.#catchCbs.forEach((cb) => {
        cb(this.#value);
      });
      this.#catchCbs = [];
    }
  }

  #onSuccess(val) {
    queueMicrotask(() => {

      if (this.#state !== this.STATE.PENDING) return;
      if (val instanceof CustomPromise) {
        val.then(this.#onSuccessBind, this.#onFailBind)
        return
      }
      
      this.#value = val
      this.#state = this.STATE.FULFILLED;
      this.#runCbs();
    })
  }

  #onFail(val) {
    queueMicrotask(() => {

      if (this.#state !== this.STATE.PENDING) return;
      if (val instanceof CustomPromise) {
        val.then(this.#onSuccessBind, this.#onFailBind)
        return
      }
      
      this.#value = val
      this.#state = this.STATE.REJECTED;
      this.#runCbs();
    })
  }

  then(thenCb, catchCb) {
    return new CustomPromise((resolve, reject) => {
      this.#thenCbs.push((thenCbresult) => {
        if (thenCb === undefined) {
          resolve(thenCbresult);
          return;
        }
        try {
          resolve(thenCb(thenCbresult));
        } catch (e) {
          reject(e);
        }
      });
      this.#catchCbs.push((catchCbresult) => {
        if (thenCb === undefined) {
          reject(catchCbresult);
          return;
        }
        try {
          resolve(catchCb(catchCbresult));
        } catch (e) {
          reject(e);
        }
      });
      this.#runCbs();
    });
  }

  catch(cb) {
    this.then(undefined, cb);
  }

  finally(cb) {
    return this.then(result => {
      cb()
      return result
    }, result => {
      cb()
      throw result
    })
  }

  static resolve(val) {
    return new CustomPromise(resolve => {
      resolve(val)
    })
  }

  static reject(val) {
    return new CustomPromise((resolve, reject) => {
      reject(val)
    })
  }

  static all(promises) {
    const results = []
    let completedPromises = 0
    new CustomPromise((resolve, reject) => {
      for(i=0; i<promises.length; i++) {
        const promise = promises[i]
        promise.then(val => {
          results[i] = val
          completedPromises++
          if (completedPromises == promise.length ) resolve(results)
        }).catch(reject)
      }
    })
  }

  static allSetteled(promises) {
    const results = []
    let completedPromises = 0
    new CustomPromise((resolve) => {
      for(i=0; i<promises.length; i++) {
        const promise = promises[i]
        promise.then(val => {
          results[i] = {status: STATE.FULFILLED, val}
        }).catch(reason => {
          results[i] = {status: STATE.REJECTED, reason}
        }).finally(() => {
          completedPromises++
          if (completedPromises === promises.length) resolve(results)
        })
      }
    })
  }

  static race(promises) {
    return new CustomPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve).catch(reject)
      })
    })
  }

  static any(promises) {
    const errors = []
    rejectedPromises = 0
    return new CustomPromise((resolve, reject) => {
      for(i=0; i<promises.length; i++) {
        const promise = promises[i]
        promise.then(resolve).catch(reason => {
          rejectedPromises++
          errors[i] = reason
          if (rejectedPromises === promises.length) reject(errors)
        })
      }
    })
  }
}