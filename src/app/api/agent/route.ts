// AI Agent endpoint — streaming conflict detection
// Branch: feat/admin-ai — Owner: Ozan Osman Akan
import { google } from '@ai-sdk/google';
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
    model: google('gemini-2.5-flash'),
    system: CONFLICT_DETECTION_SYSTEM_PROMPT,
    messages,
    tools: agentTools,
  });

  return result.toTextStreamResponse();
}
