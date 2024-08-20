type Subscriber<T> = (value: T) => void;

export class Signal<T> {
    private _value: T;
    private subscribers: Set<Subscriber<T>> = new Set();

    constructor(value: T) {
        this._value = value;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        if (this._value !== newValue) {
            this._value = newValue;
            this.notify();
        }
    }

    subscribe(subscriber: Subscriber<T>): () => void {
        this.subscribers.add(subscriber);
        return () => this.subscribers.delete(subscriber);
    }

    private notify() {
        for (const subscriber of this.subscribers) {
            subscriber(this._value);
        }
    }
}
