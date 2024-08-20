import { runEffects } from "./effect";

let pendingUpdates: Function[] = [];
let isUpdating = false;

export const batchUpdate = (updateFn: Function) => {
    pendingUpdates.push(updateFn);
    if (!isUpdating) {
        isUpdating = true;
        queueMicrotask(() => {
            try {
                pendingUpdates.forEach(fn => fn());
            } finally {
                pendingUpdates = [];
                isUpdating = false;
                runEffects();
            }
        });
    }
}
