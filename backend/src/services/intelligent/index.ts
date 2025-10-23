/**
 * Intelligent Two-Agent System - Entry Point
 * 
 * Pure agentic workflow with two specialized agents:
 * 1. Extraction Agent: File → Raw Text
 * 2. Analysis Agent: Raw Text → Structured Timetable
 */

export { intelligentExtraction } from './intelligent.service';
export { runExtractionAgent } from './extraction.agent';
export { runAnalysisAgent } from './analysis.agent';

