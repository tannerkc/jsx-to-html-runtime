import { escapeHTML, escapeProp } from "./escaping";
import { type JSX } from "./jsx-runtime";
import { serialize } from "./serialize";
import { type FunctionComponent, RenderedNode } from "./types";

// Memoization for renderAttributes
const memoizedRenderAttributes = new WeakMap<JSX.HTMLAttributes, string>();

const renderAttributes = (attributes: JSX.HTMLAttributes): string => {
  if (memoizedRenderAttributes.has(attributes)) {
    return memoizedRenderAttributes.get(attributes)!;
  }

  const result = Object.entries(attributes)
    .filter(([key]) => key !== "children")
    .map(([key, value]) => `${key}="${serialize(value, escapeProp)}"`)
    .join(" ");

  memoizedRenderAttributes.set(attributes, result);
  return result;
};

const renderChildren = (attributes: JSX.HTMLAttributes): string => {
  const { children } = attributes;
  if (!children) return "";
  return (Array.isArray(children) ? children : [children])
    .map(child => serialize(child, escapeHTML))
    .join("");
};

const renderTag = (tag: string, attributes: string, children: string): string => {
  const tagWithAttributes = `${tag} ${attributes}`.trim();
  return children
    ? `<${tagWithAttributes}>${children}</${tag}>`
    : `<${tagWithAttributes}/>`;
};

// Memoization for frequently used components
const memoizedComponents = new WeakMap<FunctionComponent, WeakMap<JSX.HTMLAttributes, RenderedNode>>();

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

    if (componentCache.has(props)) {
      return componentCache.get(props)!;
    }

    const result = tag(props);
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