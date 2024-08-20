import { escapeHTML, escapeProp } from "./escaping";
import { type JSX } from "./jsx-runtime";
import { serialize } from "./serialize";
import { type FunctionComponent, RenderedNode } from "./types";
import { Signal } from './signal';
import { batchUpdate } from "./batch";

const memoizedRenderAttributes = new WeakMap<JSX.HTMLAttributes, string>();

const renderAttributes = (attributes: JSX.HTMLAttributes): string => {
//   if (memoizedRenderAttributes.has(attributes)) {
//     return memoizedRenderAttributes.get(attributes)!;
//   }

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

function shallowEqual(objA: any, objB: any): boolean {
    if (objA === objB) return true;
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) return false;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        if (!keysB.includes(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
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
        if (cachedResult && shallowEqual(props, componentCache.get(props))) {
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
