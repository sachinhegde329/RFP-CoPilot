import { config } from 'dotenv';
config();

import '@/ai/flows/smart-answer-generation.ts';
import '@/ai/flows/ai-expert-review.ts';
import '@/ai/flows/auto-summarize-rfp.ts';
import '@/ai/flows/extract-rfp-questions.ts';
