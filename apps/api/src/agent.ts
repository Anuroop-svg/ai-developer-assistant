import OpenAI from 'openai';
import type { ResponseInputItem } from 'openai/resources/responses/responses';
import { executeTool, type ToolName } from './tools.js';

const model = process.env.OPENAI_MODEL ?? 'gpt-5.6';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to the project root .env file and restart the server.');
  }

  return new OpenAI({ apiKey });
}

const toolDefinitions: OpenAI.Responses.FunctionTool[] = [
  {
    type: 'function',
    name: 'getWeather',
    description: 'Get current weather for a city. Demo data in this milestone.',
    strict: true,
    parameters: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'calculate',
    description: 'Evaluate a basic arithmetic expression.',
    strict: true,
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string' } },
      required: ['expression'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'searchDocs',
    description: 'Search the local developer-assistant documentation index.',
    strict: true,
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
];

const instructions = `You are an AI Developer Assistant used for learning agentic AI.
Be clear and practical. Use tools when they materially improve the answer.
Never pretend a tool result is real-world live data when it is demo data.
Do not perform destructive actions. Explain when you are using a tool.`;

export type AgentEvent =
  | { type: 'tool_call'; name: string; arguments: unknown }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string };

export async function runAgent(
  userMessage: string,
  history: ResponseInputItem[] = [],
  onEvent?: (event: AgentEvent) => void,
): Promise<{ text: string; input: ResponseInputItem[] }> {
  const client = getClient();
  const input: ResponseInputItem[] = [
    ...history,
    { role: 'user', content: [{ type: 'input_text', text: userMessage }] },
  ];

  for (let step = 0; step < 6; step += 1) {
    const response = await client.responses.create({
      model,
      instructions,
      input,
      tools: toolDefinitions,
    });

    input.push(...response.output as ResponseInputItem[]);

    const functionCalls = response.output.filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
        item.type === 'function_call',
    );

    if (functionCalls.length === 0) {
      const text = response.output_text?.trim() || 'The model returned no text.';
      onEvent?.({ type: 'message', text });
      return { text, input };
    }

    for (const call of functionCalls) {
      try {
        const name = call.name as ToolName;
        const args = JSON.parse(call.arguments) as unknown;
        onEvent?.({ type: 'tool_call', name, arguments: args });

        const result = await executeTool(name, args);
        onEvent?.({ type: 'tool_result', name, result });

        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool execution failed.';
        onEvent?.({ type: 'error', message });
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify({ error: message }),
        });
      }
    }
  }

  throw new Error('Agent stopped after reaching the maximum number of tool steps.');
}
