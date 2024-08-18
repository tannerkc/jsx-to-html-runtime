export type JSXNode =
  | RenderedNode
  | RawContentNode
  | (() => JSXNode)
  // | (() => void)
  | boolean
  | number
  | bigint
  | string
  | null
  | undefined;

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
