/** How-to content per exercise: numbered steps, one thing to do, one to avoid, and photos where a free photo shows exactly this exercise. */
export interface Guide {
  steps: string[];
  do: string;
  avoid: string;
  /** Photo set in src/photos (public domain, free-exercise-db) and a label per frame (frame k = <set>-<k>.jpg). */
  photos?: { set: string; frames: string[] };
}

const START_END = ['Start', 'End'];

export const GUIDES: Record<string, Guide> = {
  'gripper-crush-reps': {
    steps: ['Set the gripper deep in your palm, handles across the fingers.', 'Squeeze until the handles touch.', 'Open slowly under control.'],
    do: 'Pick a gripper you can close for 8+ reps',
    avoid: 'Letting the handles snap open',
  },
  'gripper-negatives': {
    steps: ['Close a gripper one level above your max, using your other hand to help.', 'Let go with the helping hand.', 'Resist the opening for 3 to 5 seconds.'],
    do: 'Keep it to low reps, at most twice a week',
    avoid: 'Doing these when your hand is already sore',
  },
  'gripper-timed-close': {
    steps: ['Close the gripper fully.', 'Keep the handles touching for the whole hold.', 'Stop the set the moment they separate.'],
    do: 'Breathe steadily through the hold',
    avoid: 'Counting time once the handles part',
  },
  'db-wrist-curl': {
    steps: ['Sit with your forearm on your thigh, palm up, wrist past the knee.', 'Lower the dumbbell as far as is comfortable.', 'Curl it up with the wrist only, then lower over 2 seconds.'],
    do: 'Keep the forearm flat on your thigh',
    avoid: 'Lifting the elbow to help',
    photos: { set: 'Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl', frames: START_END },
  },
  'db-reverse-wrist-curl': {
    steps: ['Sit with your forearm on your thigh, palm down, wrist past the knee.', 'Lift the back of your hand toward the ceiling.', 'Lower slowly over 3 seconds.'],
    do: 'Go light: the extensors are much weaker',
    avoid: 'Swinging the weight up',
    photos: { set: 'Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl', frames: START_END },
  },
  'hammer-curl': {
    steps: ['Stand tall, dumbbells at your sides, thumbs forward.', 'Curl up with a neutral grip, elbows pinned.', 'Lower under control.'],
    do: 'Keep the elbows at your sides',
    avoid: 'Swinging your body to lift',
    photos: { set: 'Hammer_Curls', frames: START_END },
  },
  'db-pronation-supination': {
    steps: ['Hold one end of a light dumbbell like a hammer.', 'Slowly rotate the forearm palm down, then palm up.', 'Keep the elbow still the whole time.'],
    do: 'Choke up on the handle to make it easier',
    avoid: 'Letting the weight drop fast at the end of the turn',
    photos: { set: 'Dumbbell_Lying_Supination', frames: START_END },
  },
  'db-farmer-carry': {
    steps: ['Pick up a dumbbell in each hand and stand tall.', 'Crush the handles, shoulders packed down.', 'Walk with short, controlled steps.'],
    do: 'Keep your chest up and eyes forward',
    avoid: 'Letting the shoulders slump forward',
  },
  'db-radial-deviation': {
    steps: ['Stand holding one end of a light dumbbell at your side, weight forward.', 'Tilt it up using only the wrist.', 'Lower slowly.'],
    do: 'Keep the elbow straight and still',
    avoid: 'Bending the elbow to lift the weight',
  },
  'bb-wrist-curl': {
    steps: ['Kneel with your forearms on a bench, palms up, wrists past the edge.', 'Let the bar roll slightly toward your fingers.', 'Curl it back up with the wrists.'],
    do: 'Keep forearms flat on the bench',
    avoid: 'Lifting the elbows off the pad',
    photos: { set: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', frames: START_END },
  },
  'bb-reverse-wrist-curl': {
    steps: ['Kneel with your forearms on a bench, palms down.', 'Raise your knuckles toward the ceiling.', 'Lower slowly.'],
    do: 'Use a light weight',
    avoid: 'Jerking the bar up',
    photos: { set: 'Palms-Down_Wrist_Curl_Over_A_Bench', frames: START_END },
  },
  'bb-reverse-curl': {
    steps: ['Hold the bar overhand at shoulder width, arms straight.', 'Curl it up, keeping the wrists straight.', 'Lower under control.'],
    do: 'Use an EZ bar if your wrists complain',
    avoid: 'Letting the wrists bend back',
    photos: { set: 'Reverse_Barbell_Curl', frames: START_END },
  },
  'bb-behind-back-wrist-curl': {
    steps: ['Hold the bar behind you, palms facing back, arms straight.', 'Curl it up with the wrists only.', 'Lower slowly.'],
    do: 'Let the bar roll to your fingertips for more range',
    avoid: 'Bending the elbows',
    photos: { set: 'Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl', frames: START_END },
  },
  'bb-double-overhand-hold': {
    steps: ['Set the bar in a rack at knee height.', 'Grip it double overhand and stand up with it.', 'Hold, squeezing hard and standing tall.'],
    do: 'Squeeze the bar as hard as you can',
    avoid: 'Straps or a mixed grip',
    photos: { set: 'Rack_Pulls', frames: ['Pull', 'Hold'] },
  },
  'kb-bottoms-up-hold': {
    steps: ['Hold the kettlebell upside down at shoulder height.', 'Keep the elbow at 90 degrees.', 'Grip hard to keep it balanced.'],
    do: 'Start light and stand clear in case it tips',
    avoid: 'Letting the wrist bend back',
  },
  'kb-farmer-carry': {
    steps: ['Pick up a kettlebell in each hand.', 'Hold the handle in the middle of your hand.', 'Walk tall without letting the bells swing.'],
    do: 'Keep the handle off your fingertips',
    avoid: 'Shrugging the shoulders up',
  },
  'kb-horn-pinch': {
    steps: ['Pinch one horn of the handle between thumb and flat fingers.', 'Lift and hold it close to your leg.', 'Set it down as soon as it slips.'],
    do: 'Keep the fingers flat on the horn',
    avoid: 'Holding on once it starts to slip',
  },
  'towel-kb-hold': {
    steps: ['Loop a towel through the kettlebell handle.', 'Grip both ends of the towel in one hand.', 'Lift and hold with the wrist straight.'],
    do: 'Keep the shoulder down',
    avoid: 'Bending the wrist',
  },
  'plate-pinch-hold': {
    steps: ['Pinch two smooth plates together, thumb on one side, fingers on the other.', 'Stand up with them at your side.', 'Hold with the wrist neutral.'],
    do: 'Use smooth sides facing out',
    avoid: 'Letting the plates slide apart',
    photos: { set: 'Plate_Pinch', frames: ['Pick up', 'Hold'] },
  },
  'plate-pinch-carry': {
    steps: ['Pinch plates in each hand, as for the hold.', 'Walk slowly.', 'Set them down before the grip fails.'],
    do: "Take smooth steps so the plates don't swing",
    avoid: 'Rushing the walk',
    photos: { set: 'Plate_Pinch', frames: ['Pick up', 'Walk'] },
  },
  'plate-pinch-curl': {
    steps: ['Pinch a single plate by its rim.', 'Curl it to your shoulder without letting it rotate.', 'Lower slowly.'],
    do: 'Keep the elbow at your side',
    avoid: 'Letting the plate tip over',
  },
  'wrist-roller-extension': {
    steps: ['Hold the roller at shoulder height, arms out, palms down.', 'Roll the weight up by curling the knuckles over the top.', 'Roll it back down under control.'],
    do: 'One full rope length up and down is 1 rep',
    avoid: 'Dropping the arms',
    photos: { set: 'Wrist_Roller', frames: START_END },
  },
  'wrist-roller-flexion': {
    steps: ['Hold the roller at shoulder height, palms up.', 'Roll the handle toward you, curling the wrists under.', 'Unroll under control.'],
    do: 'Keep the shoulders relaxed',
    avoid: 'Shrugging to help',
  },
  'wrist-roller-eccentric': {
    steps: ['Roll the weight up any way you like.', 'Unroll it slowly over 20 to 30 seconds.', 'Repeat.'],
    do: 'Go slow: this one is for the tendons',
    avoid: 'Letting the weight drop',
  },
  'band-finger-extension': {
    steps: ['Put a rubber band around your fingertips.', 'Spread the fingers wide against it.', 'Pause at the open position, then close.'],
    do: 'Spread all five fingers evenly',
    avoid: 'Rushing through the reps',
  },
  'band-wrist-extension': {
    steps: ['Sit and stand on the band, forearm on your thigh, palm down.', 'Lift the back of your hand.', 'Lower over 3 seconds.'],
    do: 'Move only at the wrist',
    avoid: 'Lifting the forearm',
  },
  'band-wrist-flexion': {
    steps: ['Sit with your forearm supported, palm up, band under your foot.', 'Curl the wrist up against the band.', 'Lower slowly.'],
    do: 'Move only at the wrist',
    avoid: 'Letting the band snap back',
  },
  'band-supination-pronation': {
    steps: ['Anchor the band to one side.', 'Elbow at 90 degrees, tucked to your side.', 'Rotate the forearm against the pull, both directions.'],
    do: 'Keep the elbow tucked',
    avoid: 'Turning the shoulder instead of the forearm',
  },
  'rice-bucket-grabs': {
    steps: ['Bury your hand in the rice.', 'Open and close it forcefully.', 'Work all the way to the bottom of the bucket.'],
    do: 'Keep a steady rhythm',
    avoid: 'Only working near the surface',
  },
  'rice-bucket-finger-spread': {
    steps: ['Bury your hand in the rice in a fist.', 'Open the fingers as wide as you can.', 'Each open is a rep.'],
    do: 'Spread against the rice with force',
    avoid: 'Half-opening the hand',
  },
  'rice-bucket-rotations': {
    steps: ['Bury your hand in the rice.', 'Twist the forearm both ways.', 'Bend the wrist in every direction.'],
    do: 'Keep every move smooth and pain-free',
    avoid: 'Forcing the end of the range',
  },
  'towel-wring': {
    steps: ['Roll up a towel (a damp one is harder).', 'Twist it hard one way.', 'Then twist it the other way.'],
    do: 'Each full twist is a rep',
    avoid: 'Only twisting in one direction',
  },
  'towel-hang': {
    steps: ['Drape two towels over the bar.', 'Grip one towel in each hand and hang.', 'Keep the shoulders engaged.'],
    do: 'Only once you can dead hang for 60 seconds',
    avoid: 'Swinging on the towels',
  },
  'dead-hang': {
    steps: ['Grip the bar overhand at shoulder width.', 'Hang with the shoulders slightly pulled down.', 'Keep your feet close to the floor.'],
    do: 'Step off when the grip starts to go',
    avoid: 'Shrugging the shoulders up to the ears',
    photos: { set: 'Pullups', frames: ['Hang'] },
  },
  'active-scap-hang': {
    steps: ['Hang from the bar with straight arms.', 'Pull the shoulder blades down and back.', 'Hold that position.'],
    do: 'Keep the elbows straight',
    avoid: 'Bending the arms to pull up',
    photos: { set: 'Scapular_Pull-Up', frames: ['Hang', 'Shoulders down'] },
  },
  'assisted-one-arm-hang': {
    steps: ['Put your feet on a box to take some weight.', 'Hang from one hand, elbow slightly bent.', 'Keep the shoulder engaged.'],
    do: 'Use the box to control the load',
    avoid: 'Hanging passively on one shoulder',
  },
  'fat-grip-db-hold': {
    steps: ['Put fat grips on the dumbbell handles.', 'Pick them up and stand tall.', 'Squeeze with the whole hand and hold.'],
    do: 'Use about 60-70% of your normal farmer weight',
    avoid: 'Holding with the fingertips only',
  },
  'fat-grip-hammer-curl': {
    steps: ['Fat grips on, neutral grip, elbows at your sides.', 'Curl the dumbbells up.', 'Lower under control.'],
    do: 'Let your grip, not your arm, set the load',
    avoid: 'Swinging the weights',
  },
  'fat-grip-bb-hold': {
    steps: ['Set the bar in a rack at knee height with fat grips on.', 'Grip it double overhand and stand up.', 'Hold, standing tall.'],
    do: 'Squeeze as hard as you can',
    avoid: 'Using a mixed grip',
  },
  'fingertip-plank': {
    steps: ['Support yourself on spread fingertips.', 'Start with your knees down.', 'Keep the fingers slightly bent and hold.'],
    do: 'Spread the load across all five fingers',
    avoid: 'Holding through finger pain',
  },
  'wrist-push-up-rocks': {
    steps: ['Get on hands and knees, palms down.', 'Rock forward and back over the wrists.', 'Repeat with the backs of the hands down.'],
    do: 'Stay in a comfortable range',
    avoid: 'Pushing into sharp pain',
  },
  'self-resisted-wrist-iso': {
    steps: ['Use the other hand to resist the wrist.', 'Push into flexion, extension and rotation without moving.', 'Hold each direction at 50-70% effort.'],
    do: 'Keep the wrist still the whole time',
    avoid: 'Pushing at full effort',
  },
  'fist-to-spread': {
    steps: ['Squeeze a hard fist for 1 second.', 'Spread the fingers as wide as you can.', 'Repeat briskly.'],
    do: 'Open fully every time',
    avoid: 'Half-closing the fist',
  },
};
