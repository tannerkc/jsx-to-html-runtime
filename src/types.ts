export type JSXNode =
  | RenderedNode
  | RawContentNode
  | ((event?: Event) => JSXNode | void)
  | Function
  | string
  | number
  | bigint
  | boolean
  | null
  | void
  | undefined
  | JSXNode[];

export class Fragment {
  children: JSXNode[];

  constructor(children: JSXNode[]) {
    this.children = children;
  }
}

export interface JSXChildren {
  children?: JSXNode | JSXNode[] | undefined;
}

interface RawContentNode {
  htmlContent: string;
}

export type FunctionComponent = (
  props: Record<string, unknown>
) => RenderedNode;

export class RenderedNode {
  public constructor(public readonly string: string) {}
}
