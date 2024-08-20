import { type JSXNode, RenderedNode } from "./types";

export class SerializationError extends Error {
  constructor(public readonly invalidValue: unknown) {
    super("Invalid value");
  }
}

type RawContentNode = { htmlContent?: string | undefined };

export const serialize = (
  value: JSXNode,
  escaper: (value: string) => string
): string => {
  if (value === null || value === undefined) return "";
  
  if (typeof value === "string") return escaper(value);
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "function") return serialize(value(), escaper);
  if (value instanceof RenderedNode) return value.string;
  if (Array.isArray(value)) return value.map(child => serialize(child, escaper)).join("");

  if (typeof value === "object" && "htmlContent" in value && typeof (value as RawContentNode).htmlContent === "string") {
    return value.htmlContent;
  }
  
  throw new SerializationError(value);
}
