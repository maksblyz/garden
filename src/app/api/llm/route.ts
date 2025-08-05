import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = 'edge'; 
export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle both direct input/data or messages array
    let input: string;
    let data: any[];
    
    if (body.messages && Array.isArray(body.messages)) {
      const messages = body.messages;
      input = messages[messages.length - 1].content;
      data = body.data || [];
    } else {
      input = body.input;
      data = body.data;
    }

    const stats = {
      tempAvg: average(data.map((d: any) => d.temperature)).toFixed(2),
      humidityAvg: average(data.map((d: any) => d.humidity)).toFixed(2),
      pressureMax: Math.max(...data.map((d: any) => d.pressure)),
    };

    const systemPrompt = `You are a sensor analyst. Use the stats I give you to answer questions. Stats: ${JSON.stringify(stats)}`;

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: input,
        },
      ],
      temperature: 0.2,
      onError: ({ error }) => console.error('stream error:', error),
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'failed to get response' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function average(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
