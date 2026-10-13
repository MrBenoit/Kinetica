export type Variables = Readonly<Record<string, number>>;
type Node =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "unary"; sign: number; child: Node }
  | { kind: "binary"; op: string; left: Node; right: Node }
  | { kind: "call"; name: string; args: Node[] };
const functions = new Map<
  string,
  { arity: number; run: (...values: number[]) => number }
>(
  Object.entries({
    sin: { arity: 1, run: Math.sin },
    cos: { arity: 1, run: Math.cos },
    tan: { arity: 1, run: Math.tan },
    asin: { arity: 1, run: Math.asin },
    acos: { arity: 1, run: Math.acos },
    atan: { arity: 1, run: Math.atan },
    sqrt: { arity: 1, run: Math.sqrt },
    abs: { arity: 1, run: Math.abs },
    exp: { arity: 1, run: Math.exp },
    log: { arity: 1, run: Math.log },
    ln: { arity: 1, run: Math.log },
    log10: { arity: 1, run: Math.log10 },
    floor: { arity: 1, run: Math.floor },
    ceil: { arity: 1, run: Math.ceil },
    round: { arity: 1, run: Math.round },
    min: { arity: 2, run: Math.min },
    max: { arity: 2, run: Math.max },
    pow: { arity: 2, run: Math.pow },
  }),
);
export const reservedNames = new Set([
  "x",
  "pi",
  "e",
  "__proto__",
  "constructor",
  "prototype",
  ...functions.keys(),
]);
export function compileExpression(
  source: string,
  parameters: string[],
): (variables: Variables) => number {
  if (!source.trim() || source.length > 256)
    throw new Error("Formula must contain 1-256 characters");
  const tokens: string[] = [];
  const token =
    /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|([+\-*/^(),]))/y;
  let offset = 0;
  while (offset < source.trimEnd().length) {
    token.lastIndex = offset;
    const match = token.exec(source);
    if (!match) throw new Error(`Unexpected character at ${offset + 1}`);
    tokens.push(match[1] ?? match[2] ?? match[3]!);
    offset = token.lastIndex;
    if (tokens.length > 160) throw new Error("Formula is too complex");
  }
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];
  const known = new Set(["x", "pi", "e", ...parameters]);
  function expression(min = 0, depth = 0): Node {
    if (depth > 32) throw new Error("Formula nesting is too deep");
    const current = take();
    if (!current) throw new Error("Expected a number, variable or function");
    let left: Node;
    if (current === "+" || current === "-")
      left = {
        kind: "unary",
        sign: current === "-" ? -1 : 1,
        child: expression(3, depth + 1),
      };
    else if (current === "(") {
      left = expression(0, depth + 1);
      if (take() !== ")") throw new Error("Missing closing parenthesis");
    } else if (/^[\d.]/.test(current)) {
      const value = Number(current);
      if (!Number.isFinite(value)) throw new Error("Number must be finite");
      left = { kind: "number", value };
    } else if (peek() === "(") {
      const fn = functions.get(current);
      if (!fn) throw new Error(`Unknown function: ${current}`);
      take();
      const args = [expression(0, depth + 1)];
      while (peek() === ",") {
        take();
        args.push(expression(0, depth + 1));
      }
      if (take() !== ")") throw new Error("Missing closing parenthesis");
      if (args.length !== fn.arity)
        throw new Error(`${current} expects ${fn.arity} argument(s)`);
      left = { kind: "call", name: current, args };
    } else {
      if (!known.has(current)) throw new Error(`Unknown variable: ${current}`);
      left = { kind: "variable", name: current };
    }
    const precedence: Record<string, number> = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      "^": 4,
    };
    while (peek() && Object.hasOwn(precedence, peek()!)) {
      const op = peek()!;
      const priority = precedence[op]!;
      if (priority < min) break;
      take();
      left = {
        kind: "binary",
        op,
        left,
        right: expression(op === "^" ? priority : priority + 1, depth + 1),
      };
    }
    return left;
  }
  const root = expression();
  if (at !== tokens.length) throw new Error(`Unexpected token: ${peek()}`);
  function evaluate(node: Node, vars: Variables): number {
    switch (node.kind) {
      case "number":
        return node.value;
      case "variable":
        return node.name === "pi"
          ? Math.PI
          : node.name === "e"
            ? Math.E
            : (vars[node.name] ?? NaN);
      case "unary":
        return node.sign * evaluate(node.child, vars);
      case "call":
        return functions
          .get(node.name)!
          .run(...node.args.map((arg) => evaluate(arg, vars)));
      case "binary": {
        const a = evaluate(node.left, vars),
          b = evaluate(node.right, vars);
        switch (node.op) {
          case "+":
            return a + b;
          case "-":
            return a - b;
          case "*":
            return a * b;
          case "/":
            return a / b;
          default:
            return a ** b;
        }
      }
    }
  }
  return (variables) => evaluate(root, variables);
}
