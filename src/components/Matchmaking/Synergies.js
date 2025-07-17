export const placeholderUserIDs = ["11Hk07E9YFWcdxZHqSJVgUaxLiH3"] // Marco (same account), Sod
    
export const weights = new Map([
    ["Question 1", 2],
    ["Question 2", 4],
    ["Question 3", 2],
    ["Question 4", 4],
    ["Question 5", 1],
    ["Question 6", 3],
    ["Question 7", 2],
    ["Question 8", 4],
    ["Question 9", 5],
    ["Question 10", 2],
    ["Question 11", 3],
    ["Question 12", 4],
    ["Question 13", 3],
    ["Question 14", 3],
    ["Question 15", 4],
    ["Question 16", 3],
    ["Question 17", 3],
]);

export const synergyMatrices = new Map([
    ["Question 1",
      new Map([
        [new Set(["Full-time", "Full-time"]), 0.9],
        [new Set(["Full-time", "Part-time"]), 0.7],
        [new Set(["Full-time", "Student"]), 0.6],
        [new Set(["Full-time", "Unemployed"]), 0.4],
        [new Set(["Part-time", "Part-time"]), 0.9],
        [new Set(["Part-time", "Student"]), 0.65],
        [new Set(["Part-time", "Unemployed"]), 0.55],
        [new Set(["Student", "Student"]), 0.9],
        [new Set(["Student", "Unemployed"]), 0.5],
        [new Set(["Unemployed", "Unemployed"]), 0.8]
      ])
    ],
    ["Question 2",
      new Map([
        [new Set(["Liberal/left leaning", "Liberal/left leaning"]), 1.0],
        [new Set(["Liberal/left leaning", "Conservative / right leaning"]), 0.2],
        [new Set(["Liberal/left leaning", "Moderate"]), 0.6],
        [new Set(["Liberal/left leaning", "other/choose not to disclose"]), 0.5],
        [new Set(["Conservative / right leaning", "Conservative / right leaning"]), 1.0],
        [new Set(["Conservative / right leaning", "Moderate"]), 0.5],
        [new Set(["Conservative / right leaning", "other/choose not to disclose"]), 0.4],
        [new Set(["Moderate", "Moderate"]), 1.0],
        [new Set(["Moderate", "other/choose not to disclose"]), 0.7],
        [new Set(["other/choose not to disclose", "other/choose not to disclose"]), 0.8]
      ])
    ],
    ["Question 3",
      new Map([
        [new Set(["I'm an early bird", "I'm an early bird"]), 1.0],
        [new Set(["I'm an early bird", "Definitely a night owl"]), 0.3],
        [new Set(["I'm an early bird", "Depends on my schedule or mood that week"]), 0.6],
        [new Set(["I'm an early bird", "I adapt to whatever life throws at me"]), 0.7],
        [new Set(["Definitely a night owl", "Definitely a night owl"]), 1.0],
        [new Set(["Definitely a night owl", "Depends on my schedule or mood that week"]), 0.6],
        [new Set(["Definitely a night owl", "I adapt to whatever life throws at me"]), 0.7],
        [new Set(["Depends on my schedule or mood that week", "Depends on my schedule or mood that week"]), 0.9],
        [new Set(["Depends on my schedule or mood that week", "I adapt to whatever life throws at me"]), 0.8],
        [new Set(["I adapt to whatever life throws at me", "I adapt to whatever life throws at me"]), 1.0]
      ])
    ],
    ["Question 4",
      new Map([
        [new Set(["Yes, I love kids!", "Yes, I love kids!"]), 1.0],
        [new Set(["Yes, I love kids!", "I'm open to it, but i'd like to take things slow"]), 0.8],
        [new Set(["Yes, I love kids!", "Id prefer not to, but never say never"]), 0.2],
        [new Set(["Yes, I love kids!", "I'm not comfortable dating someone with kids"]), 0.0],
        [new Set(["I'm open to it, but i'd like to take things slow", "I'm open to it, but i'd like to take things slow"]), 1.0],
        [new Set(["I'm open to it, but i'd like to take things slow", "Id prefer not to, but never say never"]), 0.4],
        [new Set(["I'm open to it, but i'd like to take things slow", "I'm not comfortable dating someone with kids"]), 0.1],
        [new Set(["Id prefer not to, but never say never", "Id prefer not to, but never say never"]), 0.7],
        [new Set(["Id prefer not to, but never say never", "I'm not comfortable dating someone with kids"]), 0.3],
        [new Set(["I'm not comfortable dating someone with kids", "I'm not comfortable dating someone with kids"]), 1.0]
      ])
    ],
    ["Question 5",
      new Map([
        [new Set(["Watching the sunset on the beach", "Watching the sunset on the beach"]), 1.0],
        [new Set(["Watching the sunset on the beach", "Stargazing in the middle of nowhere"]), 0.7],
        [new Set(["Watching the sunset on the beach", "Exploring a new city together"]), 0.7],
        [new Set(["Stargazing in the middle of nowhere", "Stargazing in the middle of nowhere"]), 1.0],
        [new Set(["Stargazing in the middle of nowhere", "Exploring a new city together"]), 0.6],
        [new Set(["Exploring a new city together", "Exploring a new city together"]), 1.0]
      ])
    ],
    ["Question 6",
      new Map([
        [new Set(["I worry about those things more than I'd like to admit", "I worry about those things more than I'd like to admit"]), 1.0],
        [new Set(["I worry about those things more than I'd like to admit", "Only if it directly affects people I care about"]), 0.7],
        [new Set(["I worry about those things more than I'd like to admit", "I try not to, but it depends on how big the situation feels"]), 0.5],
        [new Set(["I worry about those things more than I'd like to admit", "I focus on what i can control most of the time"]), 0.4],
        [new Set(["Only if it directly affects people I care about", "Only if it directly affects people I care about"]), 1.0],
        [new Set(["Only if it directly affects people I care about", "I try not to, but it depends on how big the situation feels"]), 0.6],
        [new Set(["Only if it directly affects people I care about", "I focus on what i can control most of the time"]), 0.5],
        [new Set(["I try not to, but it depends on how big the situation feels", "I try not to, but it depends on how big the situation feels"]), 0.9],
        [new Set(["I try not to, but it depends on how big the situation feels", "I focus on what i can control most of the time"]), 0.7],
        [new Set(["I focus on what i can control most of the time", "I focus on what i can control most of the time"]), 1.0]
      ])
    ],
    ["Question 7",
      new Map([
        [new Set(["Logical", "Logical"]), 1.0],
        [new Set(["Logical", "Emotional"]), 0.6],
        [new Set(["Logical", "Practical"]), 0.7],
        [new Set(["Logical", "I just appreciate someone who's open to learning and growing"]), 0.8],
        [new Set(["Emotional", "Emotional"]), 1.0],
        [new Set(["Emotional", "Practical"]), 0.6],
        [new Set(["Emotional", "I just appreciate someone who's open to learning and growing"]), 0.8],
        [new Set(["Practical", "Practical"]), 1.0],
        [new Set(["Practical", "I just appreciate someone who's open to learning and growing"]), 0.8],
        [new Set(["I just appreciate someone who's open to learning and growing", "I just appreciate someone who's open to learning and growing"]), 1.0]
      ])
    ],
    ["Question 8",
      new Map([
        [new Set(["I'm an open book", "I'm an open book"]), 1.0],
        [new Set(["I'm an open book", "Depends on how much I trust the person"]), 0.7],
        [new Set(["I'm an open book", "I tend to keep my emotions to myself"]), 0.5],
        [new Set(["I'm an open book", "It's rare for me to share my emotions"]), 0.4],
        [new Set(["Depends on how much I trust the person", "Depends on how much I trust the person"]), 1.0],
        [new Set(["Depends on how much I trust the person", "I tend to keep my emotions to myself"]), 0.6],
        [new Set(["Depends on how much I trust the person", "It's rare for me to share my emotions"]), 0.5],
        [new Set(["I tend to keep my emotions to myself", "I tend to keep my emotions to myself"]), 1.0],
        [new Set(["I tend to keep my emotions to myself", "It's rare for me to share my emotions"]), 0.8],
        [new Set(["It's rare for me to share my emotions", "It's rare for me to share my emotions"]), 1.0]
      ])
    ],
    ["Question 9",
      new Map([
        [new Set(["Life partner", "Life partner"]), 1.0],
        [new Set(["Life partner", "Long-term relationship"]), 0.8],
        [new Set(["Life partner", "Short-term relationship"]), 0.1],
        [new Set(["Life partner", "Long-term, open to short"]), 0.4],
        [new Set(["Life partner", "Short term open to long"]), 0.3],
        [new Set(["Long-term relationship", "Long-term relationship"]), 1.0],
        [new Set(["Long-term relationship", "Short-term relationship"]), 0.2],
        [new Set(["Long-term relationship", "Long-term, open to short"]), 0.5],
        [new Set(["Long-term relationship", "Short term open to long"]), 0.4],
        [new Set(["Short-term relationship", "Short-term relationship"]), 1.0],
        [new Set(["Short-term relationship", "Long-term, open to short"]), 0.6],
        [new Set(["Short-term relationship", "Short term open to long"]), 0.7],
        [new Set(["Long-term, open to short", "Long-term, open to short"]), 1.0],
        [new Set(["Long-term, open to short", "Short term open to long"]), 0.8],
        [new Set(["Short term open to long", "Short term open to long"]), 1.0]
      ])
    ],
    ["Question 10",
      new Map([
        [new Set(["Agnostic", "Agnostic"]), 1.0],
        [new Set(["Agnostic", "Atheist"]), 0.8],
        [new Set(["Agnostic", "Buddhist"]), 0.7],
        [new Set(["Agnostic", "Catholic"]), 0.5],
        [new Set(["Agnostic", "Christian"]), 0.5],
        [new Set(["Agnostic", "Hindu"]), 0.5],
        [new Set(["Agnostic", "Jewish"]), 0.5],
        [new Set(["Agnostic", "Muslim"]), 0.5],
        [new Set(["Agnostic", "Sikh"]), 0.5],
        [new Set(["Agnostic", "Spiritual"]), 0.7],
        [new Set(["Agnostic", "Other"]), 0.6],
        [new Set(["Agnostic", "Prefer not to say"]), 0.7],
        [new Set(["Atheist", "Atheist"]), 1.0],
        [new Set(["Atheist", "Buddhist"]), 0.6],
        [new Set(["Atheist", "Catholic"]), 0.3],
        [new Set(["Atheist", "Christian"]), 0.3],
        [new Set(["Atheist", "Hindu"]), 0.3],
        [new Set(["Atheist", "Jewish"]), 0.3],
        [new Set(["Atheist", "Muslim"]), 0.3],
        [new Set(["Atheist", "Sikh"]), 0.3],
        [new Set(["Atheist", "Spiritual"]), 0.5],
        [new Set(["Atheist", "Other"]), 0.5],
        [new Set(["Atheist", "Prefer not to say"]), 0.6],
        [new Set(["Buddhist", "Buddhist"]), 1.0],
        [new Set(["Buddhist", "Catholic"]), 0.5],
        [new Set(["Buddhist", "Christian"]), 0.5],
        [new Set(["Buddhist", "Hindu"]), 0.6],
        [new Set(["Buddhist", "Jewish"]), 0.5],
        [new Set(["Buddhist", "Muslim"]), 0.5],
        [new Set(["Buddhist", "Sikh"]), 0.6],
        [new Set(["Buddhist", "Spiritual"]), 0.7],
        [new Set(["Buddhist", "Other"]), 0.6],
        [new Set(["Buddhist", "Prefer not to say"]), 0.6],
        [new Set(["Catholic", "Catholic"]), 1.0],
        [new Set(["Catholic", "Christian"]), 0.8],
        [new Set(["Catholic", "Hindu"]), 0.4],
        [new Set(["Catholic", "Jewish"]), 0.5],
        [new Set(["Catholic", "Muslim"]), 0.4],
        [new Set(["Catholic", "Sikh"]), 0.4],
        [new Set(["Catholic", "Spiritual"]), 0.5],
        [new Set(["Catholic", "Other"]), 0.5],
        [new Set(["Catholic", "Prefer not to say"]), 0.5],
        [new Set(["Christian", "Christian"]), 1.0],
        [new Set(["Christian", "Hindu"]), 0.4],
        [new Set(["Christian", "Jewish"]), 0.5],
        [new Set(["Christian", "Muslim"]), 0.4],
        [new Set(["Christian", "Sikh"]), 0.4],
        [new Set(["Christian", "Spiritual"]), 0.5],
        [new Set(["Christian", "Other"]), 0.5],
        [new Set(["Christian", "Prefer not to say"]), 0.5],
        [new Set(["Hindu", "Hindu"]), 1.0],
        [new Set(["Hindu", "Jewish"]), 0.4],
        [new Set(["Hindu", "Muslim"]), 0.4],
        [new Set(["Hindu", "Sikh"]), 0.5],
        [new Set(["Hindu", "Spiritual"]), 0.6],
        [new Set(["Hindu", "Other"]), 0.5],
        [new Set(["Hindu", "Prefer not to say"]), 0.5],
        [new Set(["Jewish", "Jewish"]), 1.0],
        [new Set(["Jewish", "Muslim"]), 0.4],
        [new Set(["Jewish", "Sikh"]), 0.4],
        [new Set(["Jewish", "Spiritual"]), 0.5],
        [new Set(["Jewish", "Other"]), 0.5],
        [new Set(["Jewish", "Prefer not to say"]), 0.5],
        [new Set(["Muslim", "Muslim"]), 1.0],
        [new Set(["Muslim", "Sikh"]), 0.4],
        [new Set(["Muslim", "Spiritual"]), 0.5],
        [new Set(["Muslim", "Other"]), 0.5],
        [new Set(["Muslim", "Prefer not to say"]), 0.5],
        [new Set(["Sikh", "Sikh"]), 1.0],
        [new Set(["Sikh", "Spiritual"]), 0.6],
        [new Set(["Sikh", "Other"]), 0.5],
        [new Set(["Sikh", "Prefer not to say"]), 0.5],
        [new Set(["Spiritual", "Spiritual"]), 1.0],
        [new Set(["Spiritual", "Other"]), 0.6],
        [new Set(["Spiritual", "Prefer not to say"]), 0.7],
        [new Set(["Other", "Other"]), 1.0],
        [new Set(["Other", "Prefer not to say"]), 0.6],
        [new Set(["Prefer not to say", "Prefer not to say"]), 1.0]
      ])
    ],
    ["Question 11", 
      new Map([
        [new Set(["Very important", "Very important"]), 1.0],
        [new Set(["Very important", "Somewhat important"]), 0.6],
        [new Set(["Very important", "Not very important"]), 0.3],
        [new Set(["Very important", "Not important at all"]), 0.1],
        [new Set(["Somewhat important", "Somewhat important"]), 1.0],
        [new Set(["Somewhat important", "Not very important"]), 0.6],
        [new Set(["Somewhat important", "Not important at all"]), 0.3],
        [new Set(["Not very important", "Not very important"]), 1.0],
        [new Set(["Not very important", "Not important at all"]), 0.7],
        [new Set(["Not important at all", "Not important at all"]), 1.0]
      ])
    ],
    ["Question 12",
      new Map([
        [new Set(["Words of affirmation", "Words of affirmation"]), 1.0],
        [new Set(["Words of affirmation", "Acts of service"]), 0.6],
        [new Set(["Words of affirmation", "Quality time"]), 0.7],
        [new Set(["Words of affirmation", "Physical touch"]), 0.6],
        [new Set(["Words of affirmation", "Receiving gifts"]), 0.4],
        [new Set(["Acts of service", "Acts of service"]), 1.0],
        [new Set(["Acts of service", "Quality time"]), 0.6],
        [new Set(["Acts of service", "Physical touch"]), 0.5],
        [new Set(["Acts of service", "Receiving gifts"]), 0.4],
        [new Set(["Quality time", "Quality time"]), 1.0],
        [new Set(["Quality time", "Physical touch"]), 0.6],
        [new Set(["Quality time", "Receiving gifts"]), 0.4],
        [new Set(["Physical touch", "Physical touch"]), 1.0],
        [new Set(["Physical touch", "Receiving gifts"]), 0.4],
        [new Set(["Receiving gifts", "Receiving gifts"]), 1.0]
      ])
    ],
    ["Question 13",
      new Map([
        [new Set(["Constant communication every day", "Constant communication every day"]), 1.0],
        [new Set(["Constant communication every day", "Periodic meaningful check-ins"]), 0.5],
        [new Set(["Constant communication every day", "I appreciate thoughtful texts"]), 0.6],
        [new Set(["Constant communication every day", "I express myself deeply when it matters"]), 0.4],
        [new Set(["Periodic meaningful check-ins", "Periodic meaningful check-ins"]), 1.0],
        [new Set(["Periodic meaningful check-ins", "I appreciate thoughtful texts"]), 0.7],
        [new Set(["Periodic meaningful check-ins", "I express myself deeply when it matters"]), 0.6],
        [new Set(["I appreciate thoughtful texts", "I appreciate thoughtful texts"]), 1.0],
        [new Set(["I appreciate thoughtful texts", "I express myself deeply when it matters"]), 0.7],
        [new Set(["I express myself deeply when it matters", "I express myself deeply when it matters"]), 1.0]
      ])
    ],
    ["Question 14",
      new Map([
        [new Set(["Partners who are best friends", "Partners who are best friends"]), 1.0],
        [new Set(["Partners who are best friends", "A romantic spark with passion"]), 0.6],
        [new Set(["Partners who are best friends", "A relationship built on independence and trust"]), 0.5],
        [new Set(["Partners who are best friends", "A calm connection with emotional stability"]), 0.7],
        [new Set(["A romantic spark with passion", "A romantic spark with passion"]), 1.0],
        [new Set(["A romantic spark with passion", "A relationship built on independence and trust"]), 0.4],
        [new Set(["A romantic spark with passion", "A calm connection with emotional stability"]), 0.5],
        [new Set(["A relationship built on independence and trust", "A relationship built on independence and trust"]), 1.0],
        [new Set(["A relationship built on independence and trust", "A calm connection with emotional stability"]), 0.6],
        [new Set(["A calm connection with emotional stability", "A calm connection with emotional stability"]), 1.0]
      ])
    ],
    ["Question 15",
      new Map([
        [new Set(["Talk it out immediately", "Talk it out immediately"]), 1.0],
        [new Set(["Talk it out immediately", "Take some time to cool down and discuss"]), 0.6],
        [new Set(["Talk it out immediately", "Write a thoughtful message about your feelings"]), 0.6],
        [new Set(["Talk it out immediately", "Avoid confrontation and wait for things to settle"]), 0.2],
        [new Set(["Take some time to cool down and discuss", "Take some time to cool down and discuss"]), 1.0],
        [new Set(["Take some time to cool down and discuss", "Write a thoughtful message about your feelings"]), 0.7],
        [new Set(["Take some time to cool down and discuss", "Avoid confrontation and wait for things to settle"]), 0.3],
        [new Set(["Write a thoughtful message about your feelings", "Write a thoughtful message about your feelings"]), 1.0],
        [new Set(["Write a thoughtful message about your feelings", "Avoid confrontation and wait for things to settle"]), 0.4],
        [new Set(["Avoid confrontation and wait for things to settle", "Avoid confrontation and wait for things to settle"]), 1.0]
      ])
    ],
    ["Question 16",
      new Map([
        [new Set(["Reassurance and affection", "Reassurance and affection"]), 1.0],
        [new Set(["Reassurance and affection", "Space to cool off"]), 0.2],
        [new Set(["Reassurance and affection", "Someone to listen without trying to fix things"]), 0.7],
        [new Set(["Reassurance and affection", "A distraction"]), 0.4],
        [new Set(["Space to cool off", "Space to cool off"]), 1.0],
        [new Set(["Space to cool off", "Someone to listen without trying to fix things"]), 0.4],
        [new Set(["Space to cool off", "A distraction"]), 0.5],
        [new Set(["Someone to listen without trying to fix things", "Someone to listen without trying to fix things"]), 1.0],
        [new Set(["Someone to listen without trying to fix things", "A distraction"]), 0.5],
        [new Set(["A distraction", "A distraction"]), 1.0]
      ])
    ],
    ["Question 17",
      new Map([
        [new Set(["Loyalty", "Loyalty"]), 1.0],
        [new Set(["Loyalty", "Communication"]), 0.7],
        [new Set(["Loyalty", "Ambition"]), 0.5],
        [new Set(["Loyalty", "Empathy"]), 0.6],
        [new Set(["Loyalty", "Humor"]), 0.5],
        [new Set(["Communication", "Communication"]), 1.0],
        [new Set(["Communication", "Ambition"]), 0.6],
        [new Set(["Communication", "Empathy"]), 0.8],
        [new Set(["Communication", "Humor"]), 0.6],
        [new Set(["Ambition", "Ambition"]), 1.0],
        [new Set(["Ambition", "Empathy"]), 0.4],
        [new Set(["Ambition", "Humor"]), 0.5],
        [new Set(["Empathy", "Empathy"]), 1.0],
        [new Set(["Empathy", "Humor"]), 0.7],
        [new Set(["Humor", "Humor"]), 1.0]
      ])
    ]
  ]);
  
export function getTopMatches(currentUserAnswers, others) {
  console.log('[MATCH] Starting matchmaking with gender-filtered users:', others.length);
  console.log('[MATCH] User IDs being processed:', others.map(o => o.userId));
  
  // Get all question keys in sorted order for determinism
  const questionKeys = Array.from(weights.keys()).sort();

  // Helper to normalize answers for comparison
  function normalize(str) {
    return typeof str === 'string' ? str.trim().toLowerCase() : str;
  }

  // Helper to compute synergies for a pair of users
  function computeSynergies(userA, userB, userIdB) {
    const synergies = new Map();
    for (const key of questionKeys) {
      const answerA = userA[key];
      const answerB = userB[key];
      if (answerA == null || answerB == null) {
        console.warn(`[MATCH] Missing answer for ${key}:`, { answerA, answerB, userA, userB });
        synergies.set(key, 0.5); // Default/neutral synergy if missing
        continue;
      }
      // Build a sorted set key for lookup, normalize answers
      const setKey = new Set([normalize(answerA), normalize(answerB)]);
      // Convert all sets in the matrix to sorted string keys for comparison
      const matrix = synergyMatrices.get(key);
      let found = false;
      for (const [set, value] of matrix) {
        // Compare as sorted arrays, normalize
        const arr1 = Array.from(set).map(normalize).sort();
        const arr2 = Array.from(setKey).map(normalize).sort();
        if (arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i])) {
          synergies.set(key, value);
          found = true;
          break;
        }
      }
      if (!found) {
        console.warn(`[MATCH] No synergy found for question '${key}' with answers:`, answerA, answerB, 'for user', userIdB);
        synergies.set(key, 0.5); // Default if no match
      } else {
        console.log(`[MATCH] Synergy for question '${key}' with answers:`, answerA, answerB, 'is', synergies.get(key));
      }
    }
    return synergies;
  }

  // Main matching logic
  const results = others.map(o => {
    console.log(`\n[MATCH] Comparing current user to userId: ${o.userId}`);
    console.log('[MATCH] Current user answers:', currentUserAnswers);
    console.log('[MATCH] Other user answers:', o.answers);
    const synergies = computeSynergies(currentUserAnswers, o.answers, o.userId);
    let weightSum = 0;
    let score = 1;
    for (const key of questionKeys) {
      const w = weights.get(key);
      const s = synergies.get(key);
      const safeSynergy = Math.min(Math.max(s, 0.01), 1); // Clamp between 0.01 and 1 to prevent inflation
      weightSum += w;
      score *= Math.pow(safeSynergy, w);
      console.log(`[MATCH] Question: ${key}, Weight: ${w}, Synergy: ${s}, Safe Synergy: ${safeSynergy}`);
    }
    const mean_score = Math.pow(score, 1 / weightSum) * 100;
    console.log(`[MATCH] Final score for userId ${o.userId}:`, mean_score);
    return { userId: o.userId, score: mean_score };
  }).sort((a, b) => b.score - a.score);

  console.log('[MATCH] Final sorted results:', results);
  return results;
}
  
const Synergies = () => {
    return {
        placeholderUserIDs,
        weights,
        synergyMatrices
    }
}

export default Synergies;