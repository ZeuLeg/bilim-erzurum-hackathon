// AI Agent endpoint — streaming conflict detection
// Branch: feat/admin-ai — Owner: Ozan Osman Akan
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { CONFLICT_DETECTION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { agentTools } from '@/lib/ai/tools';

export const maxDuration = 60;

export async function POST(request: Request) {
  let messages;
  try {
    ({ messages } = await request.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages must be an array' }), { status: 400 });
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: CONFLICT_DETECTION_SYSTEM_PROMPT,
    messages,
    tools: agentTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
