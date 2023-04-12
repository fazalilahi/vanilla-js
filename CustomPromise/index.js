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
}

// new Promise((resolve, reject) => {
// })
