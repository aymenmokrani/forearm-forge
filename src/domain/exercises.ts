import type { Equipment, Exercise, Target } from './types';

export const EXERCISES: Exercise[] = [
  { id: 'gripper-crush-reps', name: 'Gripper Crush Reps', equipment: ['gripper'], targets: ['crush-grip'], type: 'reps', difficulty: 1, cue: 'Set the gripper deep in the palm, squeeze until the handles touch, open under control. Pick a gripper you can close for 8+ reps before moving up.' },
  { id: 'gripper-negatives', name: 'Gripper Negatives', equipment: ['gripper'], targets: ['crush-grip'], type: 'reps', difficulty: 3, maxReps: 5, cue: 'Close a gripper one level above your max using your other hand, then resist the opening for 3-5 seconds. Low reps, at most twice a week.' },
  { id: 'gripper-timed-close', name: 'Gripper Closed Hold', equipment: ['gripper'], targets: ['crush-grip'], type: 'hold', difficulty: 2, cue: 'Close the handles fully and keep them touching for the whole hold. The set ends the moment they separate.' },
  { id: 'db-wrist-curl', name: 'Dumbbell Wrist Curl', equipment: ['dumbbell'], targets: ['wrist-flexors'], type: 'reps', difficulty: 1, cue: 'Forearm on your thigh or a bench, palm up, wrist off the edge. Curl through a full pain-free range and lower slowly.' },
  { id: 'db-reverse-wrist-curl', name: 'Dumbbell Reverse Wrist Curl', equipment: ['dumbbell'], targets: ['wrist-extensors'], type: 'reps', difficulty: 1, cue: 'Palm down with the forearm supported. Lift the back of the hand toward the ceiling, light weight, 3-second lowering.' },
  { id: 'hammer-curl', name: 'Hammer Curl', equipment: ['dumbbell'], targets: ['brachioradialis'], type: 'reps', difficulty: 1, cue: 'Neutral thumbs-up grip, elbows pinned to your sides. No swinging.' },
  { id: 'db-pronation-supination', name: 'Dumbbell Pronation/Supination', equipment: ['dumbbell'], targets: ['pronation-supination'], type: 'reps', difficulty: 2, cue: 'Hold one end of a light dumbbell like a hammer and rotate slowly palm-down to palm-up. Choke up on the handle to make it easier.' },
  { id: 'db-farmer-carry', name: 'Dumbbell Farmer Carry', equipment: ['dumbbell'], targets: ['support-grip'], type: 'hold', difficulty: 1, cue: 'Crush the handles, keep the shoulders packed and stand tall. Short, controlled steps.' },
  { id: 'db-radial-deviation', name: 'Dumbbell Radial Deviation', equipment: ['dumbbell'], targets: ['brachioradialis', 'wrist-extensors'], type: 'reps', difficulty: 2, cue: 'Stand holding one end of a light dumbbell at your side, weight forward. Tilt it up using only the wrist, elbow straight and still.' },
  { id: 'bb-wrist-curl', name: 'Barbell Wrist Curl', equipment: ['barbell'], targets: ['wrist-flexors'], type: 'reps', difficulty: 1, cue: 'Kneel with your forearms on a bench, palms up. Let the bar roll slightly toward the fingers, then curl it back up.' },
  { id: 'bb-reverse-wrist-curl', name: 'Barbell Reverse Wrist Curl', equipment: ['barbell'], targets: ['wrist-extensors'], type: 'reps', difficulty: 2, cue: 'Palms down, forearms supported, raise the knuckles. Go light: the extensors are much weaker than the flexors.' },
  { id: 'bb-reverse-curl', name: 'Reverse Curl', equipment: ['barbell'], targets: ['brachioradialis', 'wrist-extensors'], type: 'reps', difficulty: 2, cue: 'Overhand, shoulder-width grip, wrists straight as you curl. An EZ bar is easier on the wrists.' },
  { id: 'bb-behind-back-wrist-curl', name: 'Behind-the-Back Wrist Curl', equipment: ['barbell'], targets: ['wrist-flexors', 'crush-grip'], type: 'reps', difficulty: 2, cue: 'Hold the bar behind you, palms facing back, and curl it up with the wrists only. Arms stay straight.' },
  { id: 'bb-double-overhand-hold', name: 'Double-Overhand Barbell Hold', equipment: ['barbell'], targets: ['support-grip'], type: 'hold', difficulty: 2, cue: 'Pull the bar from a rack set at knee height. No straps, no mixed grip. Squeeze hard and stand tall.' },
  { id: 'kb-bottoms-up-hold', name: 'Bottoms-Up Kettlebell Hold', equipment: ['kettlebell'], targets: ['crush-grip', 'wrist-flexors'], type: 'hold', difficulty: 2, cue: 'Hold the bell upside down at shoulder height, elbow at 90°, gripping hard to keep it balanced. Start light and stand clear in case it tips.' },
  { id: 'kb-farmer-carry', name: 'Kettlebell Farmer Carry', equipment: ['kettlebell'], targets: ['support-grip'], type: 'hold', difficulty: 1, cue: 'Handle in the middle of your hand, not the fingertips. Walk tall without letting the bells swing.' },
  { id: 'kb-horn-pinch', name: 'Kettlebell Horn Pinch Hold', equipment: ['kettlebell'], targets: ['pinch-grip'], type: 'hold', difficulty: 2, cue: 'Pinch one horn of the handle between the thumb and flat fingers. Keep the bell close to your leg and set it down as soon as it slips.' },
  { id: 'towel-kb-hold', name: 'Towel Kettlebell Hold', equipment: ['kettlebell', 'towel'], targets: ['support-grip', 'crush-grip'], type: 'hold', difficulty: 2, cue: 'Loop a towel through the handle and grip both ends. Wrist straight, shoulder down.' },
  { id: 'plate-pinch-hold', name: 'Plate Pinch Hold', equipment: ['plate'], targets: ['pinch-grip'], type: 'hold', difficulty: 1, cue: 'Pinch two smooth plates together, thumb on one side, fingers on the other. Hold at your side with the wrist neutral.' },
  { id: 'plate-pinch-carry', name: 'Plate Pinch Carry', equipment: ['plate'], targets: ['pinch-grip', 'support-grip'], type: 'hold', difficulty: 2, cue: 'Walk slowly while pinching plates in each hand. Smooth steps so the plates don\'t swing.' },
  { id: 'plate-pinch-curl', name: 'Plate Pinch Curl', equipment: ['plate'], targets: ['pinch-grip', 'brachioradialis'], type: 'reps', difficulty: 2, cue: 'Pinch a single plate by its rim and curl it to your shoulder without letting it rotate. Lower slowly.' },
  { id: 'wrist-roller-extension', name: 'Wrist Roller (Overhand)', equipment: ['wrist-roller'], targets: ['wrist-extensors', 'brachioradialis'], type: 'reps', difficulty: 2, maxReps: 4, cue: 'Arms out at shoulder height, palms down, roll the weight up by curling the knuckles over the top. One full rope length up and down is 1 rep.' },
  { id: 'wrist-roller-flexion', name: 'Wrist Roller (Underhand)', equipment: ['wrist-roller'], targets: ['wrist-flexors'], type: 'reps', difficulty: 2, maxReps: 4, cue: 'Roll the handle toward you, curling the wrists under. Shoulders relaxed. One full rope length is 1 rep.' },
  { id: 'wrist-roller-eccentric', name: 'Wrist Roller Slow Lower', equipment: ['wrist-roller'], targets: ['wrist-flexors', 'wrist-extensors'], type: 'reps', difficulty: 1, maxReps: 3, cue: 'Roll the weight up any way you like, then unroll it under control over 20-30 seconds. Great for tendons.' },
  { id: 'band-finger-extension', name: 'Band Finger Extensions', equipment: ['band'], targets: ['finger-extensors'], type: 'reps', difficulty: 1, cue: 'Rubber band around the fingertips, spread the fingers wide against it and pause at the open position. Balances all the gripping.' },
  { id: 'band-wrist-extension', name: 'Band Wrist Extension', equipment: ['band'], targets: ['wrist-extensors'], type: 'reps', difficulty: 1, cue: 'Stand on the band, palm down, forearm on your thigh, and lift the back of the hand. 3-second lowering.' },
  { id: 'band-wrist-flexion', name: 'Band Wrist Flexion', equipment: ['band'], targets: ['wrist-flexors'], type: 'reps', difficulty: 1, cue: 'Palm up with the forearm supported, curl the wrist against the band. Move only at the wrist.' },
  { id: 'band-supination-pronation', name: 'Band Supination/Pronation', equipment: ['band'], targets: ['pronation-supination'], type: 'reps', difficulty: 1, cue: 'Anchor the band to one side, elbow at 90° and tucked, rotate the forearm against the pull. Train both directions.' },
  { id: 'rice-bucket-grabs', name: 'Rice Bucket Grabs', equipment: ['rice-bucket'], targets: ['crush-grip', 'wrist-flexors'], type: 'reps', difficulty: 1, cue: 'Bury your hand, then open and close it forcefully all the way down to the bottom of the bucket. Steady rhythm.' },
  { id: 'rice-bucket-finger-spread', name: 'Rice Bucket Finger Spreads', equipment: ['rice-bucket'], targets: ['finger-extensors'], type: 'reps', difficulty: 1, cue: 'From a closed fist, open the fingers as wide as you can against the rice. Each open is a rep.' },
  { id: 'rice-bucket-rotations', name: 'Rice Bucket Rotations', equipment: ['rice-bucket'], targets: ['pronation-supination', 'wrist-flexors', 'wrist-extensors'], type: 'reps', difficulty: 1, cue: 'Hand buried, twist the forearm and bend the wrist in every direction. Smooth and pain-free.' },
  { id: 'towel-wring', name: 'Towel Wring', equipment: ['towel'], targets: ['crush-grip', 'pronation-supination'], type: 'reps', difficulty: 1, cue: 'Twist a rolled (or damp) towel hard one way, then the other. Each full twist is a rep.' },
  { id: 'towel-hang', name: 'Towel Hang', equipment: ['towel', 'pullup-bar'], targets: ['support-grip', 'crush-grip'], type: 'hold', difficulty: 3, cue: 'Drape two towels over the bar and hang from them, shoulders engaged. Only once you can dead hang for 60 seconds.' },
  { id: 'dead-hang', name: 'Dead Hang', equipment: ['pullup-bar'], targets: ['support-grip'], type: 'hold', difficulty: 1, cue: 'Overhand grip at shoulder width, shoulders slightly pulled down, not shrugged to the ears. Keep your feet close to the floor so you can step off.' },
  { id: 'active-scap-hang', name: 'Active Scapular Hang', equipment: ['pullup-bar'], targets: ['support-grip'], type: 'hold', difficulty: 1, cue: 'Hang, then pull the shoulder blades down and back without bending the elbows. Hold that position.' },
  { id: 'assisted-one-arm-hang', name: 'Assisted One-Arm Hang', equipment: ['pullup-bar'], targets: ['support-grip'], type: 'hold', difficulty: 3, cue: 'Hang from one hand with your feet on a box taking some weight. Slight bend in the elbow, shoulder engaged.' },
  { id: 'fat-grip-db-hold', name: 'Fat Grip Dumbbell Hold', equipment: ['fat-grip', 'dumbbell'], targets: ['support-grip', 'crush-grip'], type: 'hold', difficulty: 2, cue: 'Thick handles are harder: use about 60-70% of your normal farmer weight. Squeeze with the whole hand.' },
  { id: 'fat-grip-hammer-curl', name: 'Fat Grip Hammer Curl', equipment: ['fat-grip', 'dumbbell'], targets: ['brachioradialis', 'crush-grip'], type: 'reps', difficulty: 2, cue: 'Neutral grip on the thick handle, lift under control. Your grip limits the load more than your arm does.' },
  { id: 'fat-grip-bb-hold', name: 'Fat Grip Barbell Hold', equipment: ['fat-grip', 'barbell'], targets: ['support-grip'], type: 'hold', difficulty: 3, cue: 'Pull the bar from a rack at knee height with the grips on. Double-overhand, stand tall.' },
  { id: 'fingertip-plank', name: 'Fingertip Plank', equipment: ['bodyweight'], targets: ['finger-extensors', 'support-grip'], type: 'hold', difficulty: 2, cue: 'Support yourself on spread fingertips, knees down to start, fingers slightly bent. Stop if the fingers hurt.' },
  { id: 'wrist-push-up-rocks', name: 'Quadruped Wrist Rocks', equipment: ['bodyweight'], targets: ['wrist-extensors', 'wrist-flexors'], type: 'reps', difficulty: 1, cue: 'On hands and knees, rock forward and back over the wrists, then repeat with the backs of the hands down. Comfortable range only.' },
  { id: 'self-resisted-wrist-iso', name: 'Self-Resisted Wrist Isometrics', equipment: ['bodyweight'], targets: ['wrist-flexors', 'wrist-extensors', 'pronation-supination'], type: 'hold', difficulty: 1, cue: 'Use the other hand to resist flexion, extension and rotation without letting the wrist move. Push at about 50-70% effort.' },
  { id: 'fist-to-spread', name: 'Fist Clench to Finger Spread', equipment: ['bodyweight'], targets: ['finger-extensors', 'crush-grip'], type: 'reps', difficulty: 1, cue: 'Squeeze a hard fist for 1 second, then spread the fingers as wide as possible. Repeat briskly.' },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

const LOADABLE: ReadonlySet<Equipment> = new Set<Equipment>(['dumbbell', 'barbell', 'kettlebell', 'plate', 'wrist-roller']);

/** Whether the exercise takes an external load worth logging in kg/lb. */
export function isLoaded(ex: Exercise): boolean {
  return ex.equipment.some((e) => LOADABLE.has(e));
}

export function isAvailable(ex: Exercise, owned: readonly Equipment[]): boolean {
  return ex.equipment.every((e) => e === 'bodyweight' || owned.includes(e));
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: 'No equipment',
  gripper: 'Hand gripper',
  dumbbell: 'Dumbbells',
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  plate: 'Weight plates',
  'wrist-roller': 'Wrist roller',
  band: 'Resistance band',
  'rice-bucket': 'Rice bucket',
  towel: 'Towel',
  'pullup-bar': 'Pull-up bar',
  'fat-grip': 'Fat grips',
};

export const TARGET_LABEL: Record<Target, string> = {
  'crush-grip': 'Crush grip',
  'support-grip': 'Support grip',
  'pinch-grip': 'Pinch grip',
  'wrist-flexors': 'Wrist flexors',
  'wrist-extensors': 'Wrist extensors',
  brachioradialis: 'Brachioradialis',
  'pronation-supination': 'Rotation',
  'finger-extensors': 'Finger extensors',
};
