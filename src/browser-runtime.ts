import { plotlySource } from "./plotly-source";

export function browserRuntime(): string {
  return `(${KINETICA_RUNTIME})(${JSON.stringify(plotlySource)});`;
}
