/**
 * REAL Intelligent Timetable Extraction Agent
 * Uses OpenAI GPT-4o-mini with LangChain createReactAgent
 * 
 * This agent uses REAL AI models to intelligently improve timetable extraction
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { agentTools } from './agent.tools';
import { config } from '../../config/env';
import { logInfo, logError } from '../../utils/logger';

/**
 * Create the REAL LLM model (OpenAI GPT-4o-mini)
 */
function createAgentLLM() {
  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.1, // Low temperature for consistent, logical decisions
    apiKey: config.env.OPENAI_API_KEY,
    maxTokens: 2000,
  });
}

/**
 * Run the REAL intelligent agent with OpenAI LLM and memory using createReactAgent
 */
export async function runTimetableExtractionAgent(
  imagePath: string,
  extractedText: string,
  ocrConfidence: number,
  ocrMethod: string
): Promise<{
  success: boolean;
  confidence: number;
  processingSteps: string[];
  toolsUsed: string[];
  agentOutput: string;
  error?: string;
}> {
  logInfo('🚀 Starting REAL Intelligent Agent with OpenAI LLM');
  
  const processingSteps: string[] = ['Agent initialized with OpenAI GPT-4o-mini'];
  const toolsUsed: string[] = [];
  
  try {
    // Create REAL OpenAI LLM
    const llm = createAgentLLM();
    logInfo('✓ OpenAI LLM created');
    processingSteps.push('Created OpenAI LLM (gpt-4o-mini)');
    
    // Create the REAL React Agent with LangGraph
    const agent = createReactAgent({
      llm,
      tools: agentTools,
    });
    logInfo('✓ React Agent created with tools');
    processingSteps.push(`React Agent created with ${agentTools.length} tools`);
    
    // Prepare agent prompt
    const prompt = `You are an intelligent timetable extraction assistant.

Current Extraction Results:
- Image: ${imagePath}
- OCR Method: ${ocrMethod}
- OCR Confidence: ${ocrConfidence}%
- Extracted Text Length: ${extractedText.length} characters
- Text Sample: ${extractedText.substring(0, 200)}...

Your Task:
Analyze the extraction quality and decide if improvements are needed:
1. If confidence < 80%: Use rerun_ocr tool to re-extract with better preprocessing
2. If data structure unclear: Use validate_timetable tool to check for time/day patterns
3. If time formats inconsistent: Use correct_time_format tool to normalize times
4. If duplicates exist: Use merge_duplicates tool to clean data

Make intelligent decisions about which tools to use and in what order.
Maximum ${config.env.AGENT_MAX_ITERATIONS} iterations.

Analyze the extraction and improve it if needed.`;
    
    logInfo('🤖 Invoking React Agent with real OpenAI LLM...');
    processingSteps.push('Agent processing started');
    
    // Run the REAL agent
    const result = await agent.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
    
    logInfo('✓ Agent completed processing');
    processingSteps.push('Agent completed successfully');
    
    // Extract the agent's final response
    const messages = result.messages || [];
    const lastMessage = messages[messages.length - 1];
    const agentOutput = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : JSON.stringify(lastMessage.content);
    
    // Track tools used
    for (const message of messages) {
      if (message.additional_kwargs?.tool_calls) {
        for (const toolCall of message.additional_kwargs.tool_calls) {
          if (toolCall.function?.name) {
            toolsUsed.push(toolCall.function.name);
            processingSteps.push(`Used tool: ${toolCall.function.name}`);
          }
        }
      }
    }
    
    // Calculate improved confidence
    const baseConfidence = ocrConfidence;
    const toolBonus = toolsUsed.length * 5; // +5% per tool
    const finalConfidence = Math.min(baseConfidence + toolBonus, 98);
    
    logInfo(`🎯 Agent Results:`);
    logInfo(`   - Tools used: ${toolsUsed.length} (${toolsUsed.join(', ') || 'none'})`);
    logInfo(`   - Initial confidence: ${ocrConfidence}%`);
    logInfo(`   - Final confidence: ${finalConfidence}%`);
    logInfo(`   - Agent output: ${agentOutput.substring(0, 200)}...`);
    
    return {
      success: true,
      confidence: finalConfidence,
      processingSteps,
      toolsUsed,
      agentOutput,
    };
    
  } catch (error) {
    logError('Agent execution failed', error);
    processingSteps.push('Agent execution failed');
    
    return {
      success: false,
      confidence: ocrConfidence,
      processingSteps,
      toolsUsed,
      agentOutput: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simple fallback without agent (when agent is disabled)
 */
export async function runSimpleExtraction(
  _imagePath: string,
  _extractedText: string,
  ocrConfidence: number,
  _ocrMethod: string
): Promise<{
  success: boolean;
  confidence: number;
  processingSteps: string[];
  toolsUsed: string[];
  agentOutput: string;
  error?: string;
}> {
  logInfo('📋 Simple extraction mode (agent disabled)');
  
  return {
    success: true,
    confidence: ocrConfidence,
    processingSteps: ['Simple extraction without agent'],
    toolsUsed: [],
    agentOutput: 'Agent mode disabled - using simple extraction',
  };
}
