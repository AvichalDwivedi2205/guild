import type { BrowserContext, Page } from '@playwright/test';

type InitScriptHost = Pick<Page, 'addInitScript'> | Pick<BrowserContext, 'addInitScript'>;

export async function installWebMcpHost(host: InitScriptHost) {
  await host.addInitScript(() => {
    const registered = new Map<string, { name: string; execute: (input: unknown) => unknown }>();
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(tool: { name: string; execute: (input: unknown) => unknown }) {
          if (registered.has(tool.name))
            throw new DOMException('Duplicate tool', 'InvalidStateError');
          registered.set(tool.name, tool);
        },
        async getTools() {
          return [...registered.values()];
        },
        async executeTool(tool: { execute: (input: unknown) => unknown }, input: unknown) {
          return JSON.stringify(await tool.execute(input));
        },
      },
    });
  });
}

export async function registeredWebMcpToolNames(page: Page): Promise<string[]> {
  return page.evaluate(async () =>
    ((await document.modelContext?.getTools?.()) ?? []).map((tool) => tool.name),
  );
}

export async function callWebMcp<Result = unknown>(
  page: Page,
  name: string,
  input: Record<string, unknown>,
): Promise<Result> {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const modelContext = document.modelContext;
      if (!modelContext?.getTools || !modelContext.executeTool)
        throw new Error('WebMCP host missing');
      const tools = await modelContext.getTools();
      const tool = tools.find((candidate) => candidate.name === toolName);
      if (!tool) throw new Error(`${toolName} missing`);
      return JSON.parse(await modelContext.executeTool(tool, toolInput)) as Result;
    },
    { toolName: name, toolInput: input },
  );
}

export function acceptanceKey(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
