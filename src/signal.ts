// type Subscriber<T> = (value: T) => void;

import { generateUniqueId } from "./uniqueId";

// export class Signal<T> {
//     private value: T;
//     private subscribers: Set<Subscriber<T>> = new Set();

//     constructor(initialValue: T) {
//         this.value = initialValue;
//         this.subscribers = new Set();
//     }

//     get(): T {
//         return this.value;
//     }

//     set(newValue: T): void {
//         if (this.value !== newValue) {
//             this.value = newValue;
//             this.notify();
//         }
//     }

//     subscribe(subscriber: () => void): () => void {
//         this.subscribers.add(subscriber);
//         return () => this.subscribers.delete(subscriber);
//     }

//     unsubscribe(subscriber: () => void): void {
//         this.subscribers.delete(subscriber);
//     }

//     private notify(): void {
//         this.subscribers.forEach(subscriber => subscriber(this.value));
//     }

//     hasSubscribers(): boolean {
//         return this.subscribers.size > 0;
//     }
// }


// import { batchUpdate } from './batch';

class Signal<T> {
  private _value: T;
  private _subscribers: Set<(newValue: T) => void> = new Set();
  private _pending: T | null = null;
  private _isBatchingUpdates: boolean = false;

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this.update(newValue);
  }

  private update(newValue: T): void {
    if (this._value !== newValue) {
      if (this._isBatchingUpdates) {
        this._pending = newValue;
      } else {
        this._value = newValue;
        this._subscribers.forEach((subscriber) => subscriber(newValue));
      }
    }
  }

  subscribe(callback: (newValue: T) => void): () => void {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  startBatch(): void {
    this._isBatchingUpdates = true;
  }

  endBatch(): void {
    this._isBatchingUpdates = false;
    if (this._pending !== null) {
      this.update(this._pending);
      this._pending = null;
    }
  }

  useState(): [T, (newValue: T | ((prevValue: T) => T)) => void] {
    const setState = (newValue: T | ((prevValue: T) => T)) => {
      if (typeof newValue === 'function') {
        this.update((newValue as (prevValue: T) => T)(this._value));
      } else {
        this.update(newValue);
      }
    };

    return [this._value, setState];
  }
}

// const useState = <T> (initialValue: T): [T, (newValue: T | ((prevValue: T) => T)) => void] => {
//   const signal = new Signal(initialValue);
//   return signal.useState();
// }

let currentSubscriber: Function | null = null;

const useState = (initialValue: any) => {
    let value = initialValue;
    const signature = generateUniqueId();
    const subscribers = new Set<Function>();
  
    const get = () => {
      if (currentSubscriber) {
        subscribers.add(currentSubscriber);
      }
      return value;
    }

    get.isGetter = true;
    get.signature = signature;
  
    const set = (newValue: any) => {
      if (value !== newValue) {
        value = newValue;
        subscribers.forEach(subscriber => subscriber());

        let signalElement = document.querySelector(`[data-signal-id='${signature}']`)
        console.log(signature)
        console.log(signalElement)
        console.log(newValue)
        if(signalElement) signalElement.innerHTML = newValue
      }
    }
  
    return [get, set];
}

export const createEffect = (effect: Function) => {
  currentSubscriber = effect;
  effect();
  currentSubscriber = null;
}

export { Signal, useState };
