import { z } from 'zod';

export const progressPhases = ['reading_context', 'working', 'writing', 'finishing'] as const;
export const progressPhaseSchema = z.enum(progressPhases);
export type ProgressPhase = z.infer<typeof progressPhaseSchema>;
