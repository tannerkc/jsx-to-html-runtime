import { escapeHTML, escapeProp } from "./escaping";
import { type JSX } from "./jsx-runtime";
import { serialize } from "./serialize";
import { Fragment, type FunctionComponent, RenderedNode } from "./types";
import { StringBuilder } from "./StringBuilder";
import { generateUniqueId } from "./uniqueId";
import { customAttributes, customElements, customElementsMap } from "./customElements";

const memoizedRenderAttributes = new WeakMap<JSX.HTMLAttributes, string>();

const renderAttributes = (attributes: JSX.HTMLAttributes): string => {
    if (memoizedRenderAttributes.has(attributes)) {
        return memoizedRenderAttributes.get(attributes)!;
    }

    const eventAttributes: Record<string, Function> = {};
    const eventListenerAttributes: Record<string, Array<{armId: string, value: Function}>> = {};
    const result = new StringBuilder();

    const armId = generateUniqueId();
    result.append(`data-arm-id="${armId}"`);

    for (const [key, value] of Object.entries(attributes)) {
        eventListenerAttributes[key] = []
        if (key.startsWith("on") && typeof value === "function") {
            eventAttributes[key] = value;
            eventListenerAttributes[key] = [...eventListenerAttributes[key], {armId, value}]
            result.append(`${key}="${value}"`);
        } else if (key !== "children") {
            result.append(`${key}="${serialize(value, escapeProp)}"`);
        }
    }

    const resultString = result.toString(" ")
    memoizedRenderAttributes.set(attributes, resultString);

    Object.keys(eventListenerAttributes).forEach(eventKey => {
        const eventName = eventKey.slice(2).toLowerCase();
        document.addEventListener(eventName, event => {
            let target = event.target as HTMLElement | null;
            while (target) {
                const armId = target.getAttribute('data-arm-id');
                if (armId) {
                    const handler = eventListenerAttributes[eventKey].find(x => x.armId === armId)?.value;
                    if (handler) handler(event);
                }
                target = target.parentElement;
            }
        });
    });

    return resultString;
};

const renderChildren = (attributes: JSX.HTMLAttributes): string => {
    const { children } = attributes;
    if (!children) return "";

    const sb = new StringBuilder();
    for (const child of Array.isArray(children) ? children : [children]) {
        if (typeof child === "function") {
            if ((child as any).isGetter) {
                const signalGetter: any = child;
                const signature = signalGetter.signature
                
                sb.append(`<span data-signal-id="${signature}">${serialize(signalGetter(), escapeHTML)}</span>`);
            }
        } else {
            sb.append(serialize(child, escapeHTML));
        }
    }

    return sb.toString().trim();
};

const renderTag = (tag: string, attributes: string, children: string): string => {
    const isCustomElement = customElements.includes(tag)
    const replacementTag = isCustomElement ? 'div' : tag;
    const customStyles = customElementsMap.get(tag) || "";

    const styleMatch = attributes.match(/style="([^"]*)"/);
    const existingStyles = styleMatch ? styleMatch[1] : "";
    
    const additionalStyles = attributes.match(/(\w+)="([^"]*)"/g)
        ?.filter((attr: string) => {
            const [key] = attr.split("=");
            return customAttributes.includes(key) && isCustomElement;
        })
        .map((attr: string) => {
            const [key, value] = attr.split("=");
            
            if (key == "basis" && tag == "sidebar") {
                return `flex-${key}: ${value};`.replace(/"/g, ''); 
            }
            if (key == "min" && tag == "grow") {
                return `min-inline-size: min(${value.replace(/"/g, '')}, 100%);`;
            }
            return `${key}: ${value};`.replace(/"/g, ''); 
        })
        .join(" ");

    const breakpointMatch = attributes.match(/breakpoint="([^"]*)"/);
    const breakpoint = breakpointMatch && breakpointMatch[1];

    const armIdMatch = attributes.match(/data-arm-id="([^"]*)"/);
    const armId = armIdMatch && armIdMatch[1];

    const mediaQueryStyles = breakpoint && `
        @media (max-width: ${breakpoint}) {
            [data-arm-id="${armId}"] {
                flex-direction: ${tag === 'flex-col' ? 'row' : 'column'};
            }
        }
    `;

    if (mediaQueryStyles) {
        const styleElement = document.createElement('style');
        styleElement.textContent = mediaQueryStyles;
        document.head.appendChild(styleElement);
    }

    const mergedStyles = [existingStyles, customStyles, additionalStyles].filter(Boolean).join(" ").trim();

    const updatedAttributes = styleMatch
        ? attributes.replace(/style="[^"]*"/, `style="${mergedStyles}"`)
        : `${attributes} style="${mergedStyles}"`;

    const tagWithAttributes = `${replacementTag} ${updatedAttributes}`.trim();
    return children
        ? `<${tagWithAttributes}>${children}</${replacementTag}>`
        : `<${tagWithAttributes}/>`;
};

const memoizedComponents = new WeakMap<FunctionComponent, WeakMap<JSX.HTMLAttributes, RenderedNode>>();

const deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) return false;
  
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
  
    if (keys1.length !== keys2.length) return false;
  
    for (const key of keys1) {
      const val1 = obj1[key];
      const val2 = obj2[key];
      const areObjects = typeof val1 === 'object' && typeof val2 === 'object';
      if (areObjects && !deepEqual(val1, val2) || !areObjects && val1 !== val2) {
        return false;
      }
    }
  
    return true;
}

export const renderJSX = (
    tag: string | FunctionComponent | undefined,
    props: JSX.HTMLAttributes,
    _key?: string
): JSX.Element => {
    if (typeof tag === "function") {
        let componentCache = memoizedComponents.get(tag);
        if (!componentCache) {
            componentCache = new WeakMap<JSX.HTMLAttributes, RenderedNode>();
            memoizedComponents.set(tag, componentCache);
        }

        const cachedResult = componentCache.get(props);
        if (cachedResult && deepEqual(props, componentCache.get(props))) {
            return cachedResult;
        }

        const result = tag(props);
        componentCache.set(props, result);
        return result;
    } else if (isFragment(tag)) {
        const sb = new StringBuilder();
        for (const child of tag.children) {
          sb.append(serialize(child, escapeHTML));
        }
        return new RenderedNode(sb.toString().trim());
    } else if (tag === undefined) {
        return new RenderedNode(renderChildren(props));
    }

    const attributes = renderAttributes(props);
    const children = renderChildren(props);
    return new RenderedNode(renderTag(tag, attributes, children));
};

function isFragment(node: any): node is Fragment {
    return node instanceof Fragment;
}
