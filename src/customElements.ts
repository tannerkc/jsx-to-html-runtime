export const customElementsMap = new Map([
    ["flex", "display: flex;"],
    ["flex-col", "display: flex; flex-direction: column;"],   
    ["flex-center", "align-self: center; justify-self: center;"],
    ["responsive", "display: flex; flex-wrap: wrap; gap: 1rem;"],
    ["sidebar", "flex-basis: 15rem; flex-grow: 1;"],
    ["grow", "flex-basis: 0; flex-grow: 999; min-inline-size: min(50%, 100%);"],
]);

export const customElements = Array.from(customElementsMap.keys());
export const customAttributes = ['gap', 'min', 'basis']
