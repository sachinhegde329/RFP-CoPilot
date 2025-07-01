import { config } from 'dotenv';
config();

import '@/ai/flows/smart-answer-generation.ts';
import '@/ai/flows/ai-expert-review.ts';
import '@/ai/flows/extract-rfp-questions.ts';
import '@/ai/flows/parse-document.ts';
import '@/ai/flows/tag-content-flow.ts';
import '@/ai/flows/detect-rfp-topics.ts';
