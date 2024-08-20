export type JSXNode =
  | RenderedNode
  | RawContentNode
  | ((e?: any) => JSXNode)
  | ((e?: any) => void)
  | Function
  | Timer
  | boolean
  | number
  | bigint
  | string
  | null
  | void
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
