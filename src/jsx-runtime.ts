import { renderJSX } from "./rendering";
import { type JSXChildren, type JSXNode, RenderedNode } from "./types";

namespace JSX {
  export type HTMLAttributes = Record<string, JSXNode | undefined> &
    JSXChildren;

  export type IntrinsicElements = Record<string, HTMLAttributes>;

  export type Element = RenderedNode;
}

export type { JSX };

export const jsx = renderJSX;
export const jsxs = renderJSX;
export const jsxDEV = renderJSX;
