/**
 * Surf Progression Framework — structured data for all skill stages.
 * Source of truth: docs/PROGRESSION.md
 */

export type SkillStage =
  | '1a' | '1b'
  | '2a' | '2b' | '2c'
  | '3a' | '3b' | '3c' | '3d' | '3e'
  | '4a' | '4b' | '4c' | '4d'
  | '5a' | '5b';

export interface ProgressionNode {
  stage: SkillStage;
  level: number;
  label: string;
  skill: string;
  idealConditions: string;
  board: string;
  drills: string[];
  progressionSignals: string[];
  videoUrl: string | null;
}

export interface LevelGroup {
  level: number;
  title: string;
  subtitle: string;
  nodes: ProgressionNode[];
}

export const PROGRESSION_LEVELS: LevelGroup[] = [
  {
    level: 1,
    title: 'Level 1',
    subtitle: 'Foundation (Whitewater)',
    nodes: [
      {
        stage: '1a',
        level: 1,
        label: 'Whitewater Pop-Up',
        skill:
          'Stand in front of an incoming section of powerful whitewater, jump on the board right before it reaches you, paddle hard, and pop up to your feet while riding the foam.',
        idealConditions:
          'Beach break, higher tide (reduces shore dump risk). 2-3ft swell producing consistent whitewater. Light wind / glassy preferred. Sandy bottom, no rocks.',
        board: '8\'+ foam board (Wavestorm, Catch Surf)',
        drills: [
          'Dry land pop-ups (20 reps/day) — chest down, hands by ribs, spring to feet in one motion',
          'Beach start: practice timing the whitewater approach, board positioning',
          'Focus: foot placement (back foot over fins, front foot centered), eyes up not down',
        ],
        progressionSignals: [
          'Can pop up 3 out of 5 attempts',
          'Riding whitewater to shore standing',
          'Comfortable being tumbled by waves',
        ],
        videoUrl: null,
      },
      {
        stage: '1b',
        level: 1,
        label: 'Small Unbroken Waves',
        skill:
          'Paddle out past the break on a small day, catch a wave before it breaks, stand up, and ride the unbroken wave straight to shore as it eventually closes out into whitewater.',
        idealConditions:
          'Beach break, high tide. 1-2ft, mellow, slow-breaking waves. Minimal current. Low crowd.',
        board: '8-9\' foam board or 9\'+ longboard',
        drills: [
          'Paddle fitness: practice paddling out through whitewater (turtle roll or push-through)',
          'Wave selection: identify which bumps will become rideable waves',
          'Timing: start paddling 3-4 strokes before the wave reaches you',
        ],
        progressionSignals: [
          'Can paddle out and back without exhaustion',
          'Catching unbroken waves 2 out of 5 attempts',
          'Standing up before the wave breaks',
          'Comfortable sitting in the lineup',
        ],
        videoUrl: null,
      },
    ],
  },
  {
    level: 2,
    title: 'Level 2',
    subtitle: 'Green Wave Fundamentals',
    nodes: [
      {
        stage: '2a',
        level: 2,
        label: 'Trimming on Green Waves',
        skill:
          'Catch a wave early enough to stand up before it breaks. Ride down the face and engage your toeside rail to angle along the wave, trimming in the pocket before the section closes out.',
        idealConditions:
          'Beach break or mellow point break. 2-3ft, lined-up swell with some shoulder. Mid to high tide. Light offshore or glassy.',
        board: '9\'+ longboard',
        drills: [
          'Angling the takeoff: paddle at a slight angle toward the shoulder instead of straight to shore',
          'Weight distribution: lean slightly forward and toward the wave face to engage the rail',
          'Look where you want to go — eyes down the line, not at your feet',
        ],
        progressionSignals: [
          'Riding along the face for 3+ seconds before the wave closes out',
          'Can feel the difference between trimming and going straight',
          'Choosing waves with a visible shoulder',
        ],
        videoUrl: null,
      },
      {
        stage: '2b',
        level: 2,
        label: 'Bottom Turn',
        skill:
          'After dropping in, compress at the bottom of the wave and carve a turn back up toward the pocket. This is the foundation of every maneuver — generating speed and redirecting momentum.',
        idealConditions:
          '2-3ft with defined shoulders. Beach break or point break. Mid tide, some push.',
        board: '9\'+ longboard',
        drills: [
          'Compress and extend: bend knees at the bottom, extend through the turn',
          'Back foot pressure: drive through the tail to pivot',
          'Draw the line: visualize a U-shape from the bottom back to the pocket',
        ],
        progressionSignals: [
          'Completing a recognizable bottom turn (not just fading)',
          'Generating speed out of the turn',
          'Linking bottom turn to a trim down the line',
        ],
        videoUrl: null,
      },
      {
        stage: '2c',
        level: 2,
        label: 'Mid-Length Transition',
        skill:
          'Transition to a shorter board (7-8\' mid-length/funboard) and execute bottom turns on slightly larger, steeper waves. The shorter board requires more precise weight placement and earlier engagement.',
        idealConditions:
          '2-4ft with some punch. Mid tide preferred — enough water but some push. Defined peaks with shoulders. Light wind.',
        board: '7-8\' mid-length, egg, or funboard',
        drills: [
          'Back foot placement: find the sweet spot over the fins on a shorter board',
          'Earlier pop-up: shorter boards require standing up faster',
          'Rail-to-rail weight transfer awareness',
        ],
        progressionSignals: [
          'Comfortable paddling and catching waves on a mid-length',
          'Completing bottom turns with the shorter board',
          'Noticeable speed generation through turns',
        ],
        videoUrl: null,
      },
    ],
  },
  {
    level: 3,
    title: 'Level 3',
    subtitle: 'Intermediate Transition',
    nodes: [
      {
        stage: '3a',
        level: 3,
        label: 'Duck Diving',
        skill:
          'On a shorter board (under 7\'6"), push the board underwater nose-first, let the whitewater pass over you, and emerge on the other side without losing significant ground. Essential for getting out in bigger surf.',
        idealConditions:
          'Practice on any day with consistent whitewater. 2-4ft is ideal for learning — enough power to test but not punishing. Start with a mid-length, progress to shortboard.',
        board: '7-8\' mid-length (learning), then 5\'8"-6\'6" shortboard',
        drills: [
          'Push the nose down with both hands, then drive the tail under with your knee or foot',
          'Timing: initiate 2-3 feet before the whitewater reaches you',
          'Depth control: deeper duck = cleaner pass-through',
        ],
        progressionSignals: [
          'Making it through 3+ waves of whitewater without getting pushed back significantly',
          'Not losing the board during duck dives',
          'Reaching the lineup without exhaustion on 3-4ft days',
        ],
        videoUrl: null,
      },
      {
        stage: '3b',
        level: 3,
        label: 'Late Takeoffs & Steeper Drops',
        skill:
          'Wait longer before popping up, allowing the wave to steepen beneath you. This builds comfort with speed, steepness, and the critical moment of commitment. Prerequisite for hollow waves.',
        idealConditions:
          '3-4ft with some steepness. Defined peaks — beach break or reef. Mid to lower tide for steeper faces. Offshore wind holds the face up.',
        board: '6\'0"-7\'0" depending on comfort and wave size',
        drills: [
          'Sit deeper: position yourself where the wave is steepest at takeoff',
          'Commit: two hard paddles then pop up — no hesitation',
          'Low center of gravity on the drop — knees bent, weight centered',
        ],
        progressionSignals: [
          'Comfortable with the feeling of free-falling into a wave',
          'Not pulling back from steep takeoffs',
          'Successful late drops 3 out of 5 attempts',
        ],
        videoUrl: null,
      },
      {
        stage: '3c',
        level: 3,
        label: 'Top Turn / Cutback',
        skill:
          'After a bottom turn, project up the wave face and redirect back toward the breaking section (cutback) or snap off the lip (top turn). This completes the fundamental turn sequence: bottom turn → top turn → repeat.',
        idealConditions:
          '3-4ft with open faces and defined lips. Not too fast — waves with some wall to work with. Mid tide, offshore or glassy.',
        board: 'Shortboard or performance mid-length',
        drills: [
          'Eyes lead the turn: look back toward the curl before your body follows',
          'Roundhouse cutback: a full arcing turn that reconnects with the whitewater',
          'Figure-8 visualization: bottom turn up, top turn back, repeat',
        ],
        progressionSignals: [
          'Completing a recognizable top turn or cutback (spray optional)',
          'Linking bottom turn → top turn → bottom turn in sequence',
          'Maintaining speed through the turn sequence',
        ],
        videoUrl: null,
      },
      {
        stage: '3d',
        level: 3,
        label: 'Reading the Lineup',
        skill:
          'Understand how sets work, identify where peaks form, read the priority system, and consistently choose the best waves rather than just catching anything. This is the mental game that separates intermediate surfers.',
        idealConditions:
          'Any conditions — this is about observation and patience. More valuable on busier days where positioning matters. Point breaks are excellent teachers (consistent takeoff zone).',
        board: 'Any',
        drills: [
          'Sit and watch for 10 minutes before paddling for a wave',
          'Identify the peak: where is the wave steepest and first to break?',
          'Set awareness: count waves per set, note the lull pattern',
          'Position relative to other surfers — practice priority and sharing',
        ],
        progressionSignals: [
          'Catching better waves (higher quality, not just quantity)',
          'Spending less energy paddling for waves that close out',
          'Other surfers aren\'t consistently beating you to waves',
          'Understanding priority and right-of-way',
        ],
        videoUrl: null,
      },
      {
        stage: '3e',
        level: 3,
        label: 'Generating Speed (Pumping)',
        skill:
          'Use rail-to-rail pumping to generate speed down the line, independent of the wave\'s power. This unlocks the ability to make sections, set up for maneuvers, and surf less-than-perfect waves.',
        idealConditions:
          '2-4ft with some wall. Sections that require speed to make. Not too powerful — allows focus on technique over survival.',
        board: 'Mid-length or shortboard',
        drills: [
          'Compression and extension: pump by bending and straightening legs in rhythm',
          'Front foot drives speed, back foot controls direction',
          'Practice on smaller waves where you need to generate your own speed',
        ],
        progressionSignals: [
          'Making sections that previously outran you',
          'Noticeable acceleration between turns',
          'Linking 3+ pumps in sequence',
        ],
        videoUrl: null,
      },
    ],
  },
  {
    level: 4,
    title: 'Level 4',
    subtitle: 'Shortboard Competence',
    nodes: [
      {
        stage: '4a',
        level: 4,
        label: 'Shortboard Paddling & Catch Rate',
        skill:
          'Paddle efficiently on a performance shortboard (5\'8"-6\'4"), generate enough speed to catch waves without the paddle power of a longer board, and maintain a high catch rate.',
        idealConditions:
          '2-4ft, not too fast. Waves with some push but not overly steep. Consistent sets for lots of reps.',
        board: 'Performance shortboard (thruster or quad) matched to surfer weight',
        drills: [
          'Paddle technique: deep, alternating strokes with cupped hands',
          'Board positioning: lie with chest on the sweet spot — too far forward = nose dive, too far back = drag',
          'Two extra paddles: when you think you\'ve caught it, paddle two more times',
        ],
        progressionSignals: [
          'Catching 4+ waves per hour on a shortboard',
          'Confident paddling into overhead waves',
          'Not reverting to longer boards for wave count',
        ],
        videoUrl: null,
      },
      {
        stage: '4b',
        level: 4,
        label: 'Floaters, Re-entries & Power Cutbacks',
        skill:
          'Execute performance maneuvers on the wave face: float across crumbling sections, hit the lip and re-enter on steep faces, and throw full-rail power cutbacks that redirect with spray. These are the building blocks of high-performance surfing.',
        idealConditions:
          '3-5ft with defined sections and lips. Waves with enough power to hit but not so heavy they shut down. Offshore or light wind for clean faces. Beach break or reef with workable walls.',
        board: 'Performance shortboard — responsive, lower volume',
        drills: [
          'Floaters: project up and across the lip as a section crumbles, land flat on the whitewash',
          'Re-entries: drive a vertical bottom turn into the lip, let the wave throw you back down, compress on landing',
          'Power cutbacks: full-speed bottom turn up the face, carve a wide arc back to the pocket, finish with a snap off the foam',
          'Commit to the lip: the most common mistake is pulling back at the last second',
        ],
        progressionSignals: [
          'Completing floaters across sections without falling',
          'Hitting the lip and landing re-entries with control',
          'Throwing spray on cutbacks consistently',
          'Linking maneuvers in sequence on a single wave',
        ],
        videoUrl: null,
      },
      {
        stage: '4c',
        level: 4,
        label: 'Barrel Awareness',
        skill:
          'Recognize when a wave is going to tube, set up the right line (high line, stall, or pull in), and experience the barrel. Even getting clipped counts — the goal is reading the section and attempting it.',
        idealConditions:
          '3-5ft hollow waves — beach break barrels or reef. Lower tide (steeper, hollower faces). Offshore wind (holds the lip open). Sand-bottom preferred for safety while learning.',
        board: 'Shortboard — slightly more volume can help with speed through the barrel',
        drills: [
          'Stall technique: drag your inside hand or shift weight back to let the lip pass over you',
          'Line selection: take off behind the peak and angle into the barrel',
          'Eyes on the exit: look through the tube to where you want to come out',
        ],
        progressionSignals: [
          'Recognizing barrel sections before they form',
          'Pulling in intentionally (not just getting caught inside)',
          'Making it out of small cover-ups',
        ],
        videoUrl: null,
      },
      {
        stage: '4d',
        level: 4,
        label: 'Aerial Awareness',
        skill:
          'Use speed and a vertical section to launch above the lip. At this stage, the goal is getting airborne — landing comes with practice. Airs require speed generation, ramp identification, and commitment.',
        idealConditions:
          '2-4ft with steep, throwable sections. Onshore wind can actually help (creates ramps). Beach break wedges ideal. Warmer water sessions (more attempts, less consequence).',
        board: 'Shortboard — shorter and lighter helps',
        drills: [
          'Speed into the section — maximum pump before the ramp',
          'Project off the lip at 45 degrees',
          'Compress on landing — absorb with bent knees',
        ],
        progressionSignals: [
          'Getting above the lip consistently',
          'Landing occasionally (even sloppy)',
          'Identifying which sections are launchable',
        ],
        videoUrl: null,
      },
    ],
  },
  {
    level: 5,
    title: 'Level 5',
    subtitle: 'Advanced',
    nodes: [
      {
        stage: '5a',
        level: 5,
        label: 'Conditions Mastery',
        skill:
          'Surf well in a wide range of conditions — bigger waves (overhead+), varied winds, unfamiliar spots. Read conditions quickly and adapt board choice, positioning, and approach.',
        idealConditions:
          'All conditions — overhead+ surf, varied winds, unfamiliar spots. Full quiver utilization for different conditions.',
        board: 'Full quiver — right board for right conditions',
        drills: [
          'Surf new spots without extended warm-up periods',
          'Practice board selection: match board to conditions before paddling out',
          'Push into progressively larger surf with proper preparation',
        ],
        progressionSignals: [
          'Comfortable in overhead+ surf',
          'Surfing new spots without a long adjustment period',
          'Choosing the right board for conditions consistently',
        ],
        videoUrl: null,
      },
      {
        stage: '5b',
        level: 5,
        label: 'Style & Flow',
        skill:
          'Move beyond functional surfing to expressive surfing. Link turns with flow, develop a personal style, surf with power and grace. This is where surfing becomes art.',
        idealConditions:
          'Any conditions that allow expression — clean faces, defined sections, room to draw lines.',
        board: 'Board that matches your style and the conditions',
        drills: [
          'Film yourself and analyze your lines — look for wasted movement',
          'Study surfers whose style you admire and emulate specific elements',
          'Focus on smooth transitions between maneuvers rather than individual tricks',
        ],
        progressionSignals: [
          'Smooth, linked maneuvers',
          'Power in turns (spray, extension)',
          'Other surfers compliment your style',
          'Video analysis shows clean, intentional lines',
        ],
        videoUrl: null,
      },
    ],
  },
];

export const ALL_STAGES: SkillStage[] = PROGRESSION_LEVELS.flatMap(
  (lg) => lg.nodes.map((n) => n.stage)
);

export function getStageIndex(stage: SkillStage): number {
  return ALL_STAGES.indexOf(stage);
}
