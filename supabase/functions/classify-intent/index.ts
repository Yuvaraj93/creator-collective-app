import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    console.log('Classifying text:', text);

    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are an AI assistant that classifies user speech into intents for a voice note-taking app. Analyze the user's speech and classify it into one of these intents:

1. CREATE_NOTE - General note taking, thoughts, ideas (default intent)
2. CREATE_TODO - When user explicitly mentions tasks, todos, reminders with action words
3. CREATE_EVENT - When user mentions scheduling, meetings, appointments with specific times
4. ASK_CALENDAR_AGENDA - When user asks about their schedule, calendar, upcoming events
5. SUMMARIZE_NOTE - When user asks to summarize their notes

Extract these entities if present:
- title: Short title for the item
- body: Main content
- priority: high/medium/low
- datetime: ISO date string for events/todos
- duration: Duration in minutes for events
- date_scope: today/tomorrow/week/month for agenda queries

Return JSON format:
{
  "intent": "CREATE_NOTE",
  "entities": {
    "title": "extracted title",
    "body": "extracted content",
    "priority": "medium",
    "datetime": "2024-01-01T10:00:00Z",
    "duration": 60
  }
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lymsduvzqtkjkvlwieme.supabase.co',
        'X-Title': 'Besto Voice Assistant',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenRouter response:', data);
    
    const content = data.choices[0].message.content;
    
    // Try to parse JSON from the response
    let classification;
    try {
      classification = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON response:', content);
      // Fallback classification
      classification = {
        intent: 'CREATE_NOTE',
        entities: {
          title: 'Voice Note',
          body: text,
          priority: 'medium'
        }
      };
    }

    console.log('Final classification:', classification);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in classify-intent function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      intent: 'CREATE_NOTE',
      entities: {
        title: 'Voice Note',
        body: 'Error processing voice input',
        priority: 'medium'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});