import { z } from 'zod';

export const toolSchemas = {
  getWeather: z.object({ city: z.string().min(1).max(100) }),
  calculate: z.object({
    expression: z.string().min(1).max(200),
  }),
  searchDocs: z.object({ query: z.string().min(1).max(200) }),
};

export type ToolName = keyof typeof toolSchemas;

const docs = [
  {
    title: 'Agent loop',
    content: 'An agent loop repeatedly selects an action, executes a tool, observes the result, and decides whether to continue or finish.',
  },
  {
    title: 'Tool calling',
    content: 'The model can request a function, but the application validates arguments, executes the function, and returns the tool result to the model.',
  },
  {
    title: 'RAG',
    content: 'Retrieval-Augmented Generation retrieves relevant external context and supplies it to the model before generating an answer.',
  },
];

function evaluateBasicArithmetic(expression: string): number {
  if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
    throw new Error('Only basic arithmetic expressions are allowed.');
  }
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expression})`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error('Expression did not produce a finite number.');
  }
  return result;
}

export async function executeTool(name: ToolName, rawArgs: unknown): Promise<unknown> {
  switch (name) {
    case 'getWeather': {
      const { city } = toolSchemas.getWeather.parse(rawArgs);
      return {
        city,
        temperatureC: 30,
        condition: 'Partly cloudy',
        note: 'Demo data: replace this implementation with a real weather API in a later milestone.',
      };
    }
    case 'calculate': {
      const { expression } = toolSchemas.calculate.parse(rawArgs);
      return { expression, result: evaluateBasicArithmetic(expression) };
    }
    case 'searchDocs': {
      const { query } = toolSchemas.searchDocs.parse(rawArgs);
      const normalized = query.toLowerCase();
      const matches = docs.filter((doc) =>
        `${doc.title} ${doc.content}`.toLowerCase().includes(normalized),
      );
      return { query, matches };
    }
    default: {
      const neverName: never = name;
      throw new Error(`Unknown tool: ${neverName}`);
    }
  }
}
