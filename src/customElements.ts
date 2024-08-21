export const customElementsMap = new Map([
    ["flex", "display: flex;"],
    ["flex-col", "display: flex; flex-direction: column;"],   
    ["flex-center", "align-self: center; justify-self: center;"],   
]);

export const customElements = Array.from(customElementsMap.keys());
