// AI Agent endpoint — streaming conflict detection
// Branch: feat/admin-ai — Owner: Ozan Osman Akan
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { CONFLICT_DETECTION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { agentTools } from '@/lib/ai/tools';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: CONFLICT_DETECTION_SYSTEM_PROMPT,
    messages,
    tools: agentTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
