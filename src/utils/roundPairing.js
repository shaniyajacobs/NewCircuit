export function generateRoundAssignments(attendees, roundDurationSeconds, breakDurationSeconds, eventStartTime) {
  // attendees: array of { id, gender }
  const men = attendees.filter(a => a.gender === 'Male');
  const women = attendees.filter(a => a.gender === 'Female');
  
  // We'll pair men with women, rotating.
  // If one group has more, some will sit out each round.
  const pairs = [];
  const numRounds = Math.min(men.length, women.length);
  if (numRounds === 0) return { roundStartTimes: [], assignments: {} };

  // Create a round-robin schedule: men fixed, women rotated
  const schedule = [];
  for (let round = 0; round < numRounds; round++) {
    const roundPairs = [];
    for (let i = 0; i < men.length; i++) {
      const womanIndex = (i + round) % women.length;
      roundPairs.push({ man: men[i].id, woman: women[womanIndex].id });
    }
    schedule.push(roundPairs);
  }

  // Build assignment map: attendeeId -> { round: partnerId }
  const assignments = {};
  attendees.forEach(a => { assignments[a.id] = {}; });

  schedule.forEach((roundPairs, roundIndex) => {
    roundPairs.forEach(pair => {
      assignments[pair.man][`round${roundIndex+1}`] = pair.woman;
      assignments[pair.woman][`round${roundIndex+1}`] = pair.man;
    });
  });

  // Calculate round start times
  const roundStartTimes = [];
  let currentTime = eventStartTime;
  for (let i = 0; i < numRounds; i++) {
    roundStartTimes.push(currentTime);
    currentTime += (roundDurationSeconds + breakDurationSeconds) * 1000;
  }

  return { roundStartTimes, assignments };
}