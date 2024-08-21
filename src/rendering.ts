import { escapeHTML, escapeProp } from "./escaping";
import { type JSX } from "./jsx-runtime";
import { serialize } from "./serialize";
import { type FunctionComponent, RenderedNode } from "./types";
import { Signal } from './signal';
import { batchUpdate } from "./batch";

const memoizedRenderAttributes = new WeakMap<JSX.HTMLAttributes, string>();

const renderAttributes = (attributes: JSX.HTMLAttributes): string => {
  if (memoizedRenderAttributes.has(attributes)) {
    return memoizedRenderAttributes.get(attributes)!;
  }

  const eventAttributes: Record<string, Function> = {};

  const armId = Math.floor(Math.random() * Date.now());
  attributes['data-arm-id'] = armId;

  const result = Object.entries(attributes)
    .filter(([key, value]) => {
      if (key.startsWith("on") && typeof value === "function") {
        eventAttributes[key] = value;
        return false;
      }
      return key !== "children";
    })
    .map(([key, value]) => `${key}="${serialize(value, escapeProp)}"`)
    .join(" ");

  memoizedRenderAttributes.set(attributes, result);

  document.addEventListener("DOMContentLoaded", () => {
    Object.keys(eventAttributes).forEach(eventKey => {
        const eventName = eventKey.slice(2).toLowerCase();
        document.querySelector(`[data-arm-id='${armId}']`)?.addEventListener(eventName, event => {
            if (event.target instanceof HTMLElement) {
                const handler = eventAttributes[eventKey];
                if (handler) handler(event);
            }
        });
    });
  })

  return result;
};

const renderChildren = (attributes: JSX.HTMLAttributes): string => {
  const { children } = attributes;
  if (!children) return "";
  return (Array.isArray(children) ? children : [children])
    .map(child => serialize(child, escapeHTML))
    .join("") 
    .trim();
};

const renderTag = (tag: string, attributes: string, children: string): string => {
    const tagWithAttributes = `${tag} ${attributes}`.trim();
    return children
        ? `<${tagWithAttributes}>${children}</${tag}>`
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

        const signalDeps = Object.values(props).filter(val => val instanceof Signal);
        if (signalDeps.length > 0) {
            signalDeps.forEach((signal: Signal<any>) => {
                signal.subscribe(() => {
                    batchUpdate(() => {
                        const updatedResult = tag(props);
                        componentCache!.set(props, updatedResult);
                    });
                });
            });
        }

        componentCache.set(props, result);
        return result;
    }

    if (tag === undefined) {
        return new RenderedNode(renderChildren(props));
    }

    const attributes = renderAttributes(props);
    const children = renderChildren(props);
    return new RenderedNode(renderTag(tag, attributes, children));
};
