import { SkillStage } from '@/constants/progression';

export type SurferLevel =
  | 'beginner'
  | 'developing'
  | 'intermediate'
  | 'progressing_intermediate'
  | 'advanced'
  | 'expert';

export type Stance = 'regular' | 'goofy';

export const SURFER_LEVEL_OPTIONS: SurferLevel[] = [
  'beginner',
  'developing',
  'intermediate',
  'progressing_intermediate',
  'advanced',
  'expert',
];

export const SURF_SKILL_OPTIONS = [
  'paddle power',
  'pop-up speed',
  'bottom turns',
  'cutbacks',
  'tube riding',
  'reading lineups',
  'wave selection',
  'duck diving',
  'positioning',
  'speed generation',
  'rail work',
  'aerials',
] as const;

export type SurfSkill = (typeof SURF_SKILL_OPTIONS)[number];

export interface SurferProfile {
  id: string;
  user_id: string | null;
  level: SurferLevel;
  years_experience: number;
  stance: Stance;
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  session_focus: string | null;
  skill_stage: SkillStage | null;
  created_at: string;
}
