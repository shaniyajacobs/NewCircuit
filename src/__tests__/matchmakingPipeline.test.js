/**
 * Tests for the full matchmaking pipeline:
 * signup -> event lookup -> signedUpUsers -> gender filtering -> matchmaking -> results
 *
 * Verifies that ALL signed-up users flow through the entire pipeline regardless
 * of whether they clicked "Join Now" or only "Sign Up".
 *
 * Uses real filterByGenderPreference and getTopMatches functions (pure logic).
 */

import { filterByGenderPreference } from '../utils/genderPreferenceFilter';
import { getTopMatches } from '../components/Matchmaking/Synergies';

// Shared quiz answers fixture
const makeQuizAnswers = (overrides = {}) => ({
  'Question 1': 'Full-time',
  'Question 2': 'Moderate',
  'Question 3': "I'm an early bird",
  'Question 4': "I'm open to it, but i'd like to take things slow",
  'Question 5': 'Watching the sunset on the beach',
  'Question 6': 'I focus on what i can control most of the time',
  'Question 7': 'Logical',
  'Question 8': "Depends on how much I trust the person",
  'Question 9': 'Long-term relationship',
  'Question 10': 'Spiritual',
  'Question 11': 'Somewhat important',
  'Question 12': 'Quality time',
  'Question 13': 'Periodic meaningful check-ins',
  'Question 14': 'Partners who are best friends',
  'Question 15': 'Take some time to cool down and discuss',
  'Question 16': 'Someone to listen without trying to fix things',
  'Question 17': 'Communication',
  ...overrides,
});

describe('Matchmaking Pipeline - all signed-up users in selection pool', () => {
  describe('filterByGenderPreference on full pool', () => {
    it('should return empty array when no users provided', () => {
      const result = filterByGenderPreference(
        { gender: 'Male', sexualPreference: 'Women' },
        []
      );
      expect(result).toEqual([]);
    });

    it('should return empty array when currentUser is null', () => {
      const result = filterByGenderPreference(null, [
        { userId: 'u1', gender: 'Female', sexualPreference: 'Men' },
      ]);
      expect(result).toEqual([]);
    });

    it('should filter correctly for male user preferring women', () => {
      const currentUser = { gender: 'Male', sexualPreference: 'Women' };
      const others = [
        { userId: 'u1', gender: 'Female', sexualPreference: 'Men' }, // mutual match
        { userId: 'u2', gender: 'Male', sexualPreference: 'Women' }, // same gender, not a match
        { userId: 'u3', gender: 'Female', sexualPreference: 'Women' }, // female but doesn't want men
      ];

      const result = filterByGenderPreference(currentUser, others);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('u1');
    });

    it('should filter correctly for female user preferring men', () => {
      const currentUser = { gender: 'Female', sexualPreference: 'Men' };
      const others = [
        { userId: 'u1', gender: 'Male', sexualPreference: 'Women' }, // mutual match
        { userId: 'u2', gender: 'Male', sexualPreference: 'Men' }, // male but doesn't want women
        { userId: 'u3', gender: 'Female', sexualPreference: 'Men' }, // same gender
      ];

      const result = filterByGenderPreference(currentUser, others);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('u1');
    });

    it('should handle "both" preference correctly', () => {
      const currentUser = { gender: 'Male', sexualPreference: 'Both' };
      const others = [
        { userId: 'u1', gender: 'Female', sexualPreference: 'Men' }, // mutual
        { userId: 'u2', gender: 'Male', sexualPreference: 'Both' }, // mutual
        { userId: 'u3', gender: 'Female', sexualPreference: 'Women' }, // no - doesn't want men
      ];

      const result = filterByGenderPreference(currentUser, others);
      expect(result).toHaveLength(2);
      expect(result.map((u) => u.userId)).toContain('u1');
      expect(result.map((u) => u.userId)).toContain('u2');
    });

    it('should include ALL gender-compatible users from the full signup pool (6 users)', () => {
      const currentUser = { gender: 'Male', sexualPreference: 'Women' };
      const others = [
        { userId: 'u1', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'u2', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'u3', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'u4', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'u5', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'u6', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'u7', gender: 'Male', sexualPreference: 'Women' }, // same gender
        { userId: 'u8', gender: 'Male', sexualPreference: 'Women' }, // same gender
      ];

      const result = filterByGenderPreference(currentUser, others);
      expect(result).toHaveLength(6);
    });

    it('should include signup-only users in gender filtering (not just Join Now users)', () => {
      // Simulating 3 users: user1 signed up only, user2 clicked Join Now, user3 signed up only
      // The signedUpUsers subcollection contains all 3 - no distinction in data
      const currentUser = { gender: 'Male', sexualPreference: 'Women' };
      const signedUpUsers = [
        { userId: 'signupOnly1', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'joinedNow2', gender: 'Female', sexualPreference: 'Men' },
        { userId: 'signupOnly3', gender: 'Female', sexualPreference: 'Men' },
      ];

      const result = filterByGenderPreference(currentUser, signedUpUsers);
      expect(result).toHaveLength(3);
      expect(result.map((u) => u.userId)).toContain('signupOnly1');
      expect(result.map((u) => u.userId)).toContain('joinedNow2');
      expect(result.map((u) => u.userId)).toContain('signupOnly3');
    });

    it('should skip users with missing gender or preference data', () => {
      const currentUser = { gender: 'Male', sexualPreference: 'Women' };
      const others = [
        { userId: 'u1', gender: 'Female', sexualPreference: 'Men' }, // valid
        { userId: 'u2', gender: 'Female' }, // missing preference
        { userId: 'u3', sexualPreference: 'Men' }, // missing gender
      ];

      const result = filterByGenderPreference(currentUser, others);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('u1');
    });
  });

  describe('getTopMatches receives complete user set', () => {
    it('should pass ALL gender-filtered users to getTopMatches and get results', () => {
      const currentUserAnswers = makeQuizAnswers();
      const others = [
        { userId: 'u1', answers: makeQuizAnswers() },
        { userId: 'u2', answers: makeQuizAnswers({ 'Question 2': 'Progressive' }) },
        { userId: 'u3', answers: makeQuizAnswers({ 'Question 7': 'Emotional' }) },
        { userId: 'u4', answers: makeQuizAnswers({ 'Question 9': 'Casual dating' }) },
      ];

      const results = getTopMatches(currentUserAnswers, others);

      expect(results).toHaveLength(4);
      expect(results.map((r) => r.userId)).toContain('u1');
      expect(results.map((r) => r.userId)).toContain('u2');
      expect(results.map((r) => r.userId)).toContain('u3');
      expect(results.map((r) => r.userId)).toContain('u4');
    });

    it('should not lose any users between signedUpUsers fetch and getTopMatches call', () => {
      const currentUserAnswers = makeQuizAnswers();

      // Simulate: 5 signed-up users, current user excluded, 4 others pass gender filter
      const filteredOthers = [
        { userId: 'signupOnly_A', answers: makeQuizAnswers() },
        { userId: 'joinedNow_B', answers: makeQuizAnswers() },
        { userId: 'signupOnly_C', answers: makeQuizAnswers() },
        { userId: 'signupOnly_D', answers: makeQuizAnswers() },
      ];

      const results = getTopMatches(currentUserAnswers, filteredOthers);

      // All 4 users should have match scores
      expect(results).toHaveLength(4);
      expect(results.every((r) => typeof r.score === 'number')).toBe(true);
      expect(results.every((r) => r.score > 0)).toBe(true);
    });

    it('should produce match results for every eligible user with valid scores', () => {
      const currentUserAnswers = makeQuizAnswers();
      const others = [
        { userId: 'u1', answers: makeQuizAnswers() },
        { userId: 'u2', answers: makeQuizAnswers({ 'Question 1': 'Part-time' }) },
        { userId: 'u3', answers: makeQuizAnswers({ 'Question 5': 'Going to a concert' }) },
      ];

      const results = getTopMatches(currentUserAnswers, others);

      expect(results).toHaveLength(3);

      // Scores should be between 0 and 100
      results.forEach((r) => {
        expect(r.score).toBeGreaterThan(0);
        expect(r.score).toBeLessThanOrEqual(100);
      });

      // User with identical answers should have highest score
      const identicalUser = results.find((r) => r.userId === 'u1');
      const differentUser = results.find((r) => r.userId === 'u2');
      expect(identicalUser.score).toBeGreaterThanOrEqual(differentUser.score);
    });

    it('should sort results by score descending', () => {
      const currentUserAnswers = makeQuizAnswers();
      const others = [
        { userId: 'u1', answers: makeQuizAnswers({ 'Question 2': 'Progressive', 'Question 7': 'Emotional' }) },
        { userId: 'u2', answers: makeQuizAnswers() }, // identical = highest score
        { userId: 'u3', answers: makeQuizAnswers({ 'Question 9': 'Casual dating', 'Question 1': 'Unemployed' }) },
      ];

      const results = getTopMatches(currentUserAnswers, others);

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });
  });

  describe('scenario: mixed signup methods - full pipeline', () => {
    it('should produce match results for signup-only users in the pool', () => {
      // Simulate the full pipeline for a male user preferring women
      const currentUserProfile = { gender: 'Male', sexualPreference: 'Women' };
      const currentUserAnswers = makeQuizAnswers();

      // All these users are in signedUpUsers subcollection
      // Their signup method (Sign Up vs Join Now) doesn't matter - they're all in the pool
      const allSignedUpProfiles = [
        { userId: 'signupOnly_Alice', gender: 'Female', sexualPreference: 'Men', answers: makeQuizAnswers() },
        { userId: 'joinedNow_Beth', gender: 'Female', sexualPreference: 'Men', answers: makeQuizAnswers({ 'Question 2': 'Progressive' }) },
        { userId: 'signupOnly_Carol', gender: 'Female', sexualPreference: 'Men', answers: makeQuizAnswers({ 'Question 7': 'Emotional' }) },
        { userId: 'signupOnly_Dave', gender: 'Male', sexualPreference: 'Women', answers: makeQuizAnswers() }, // same gender
      ];

      // Step 1: Gender filter
      const genderFiltered = filterByGenderPreference(currentUserProfile, allSignedUpProfiles);

      // Should include Alice, Beth, Carol (all female wanting men) but not Dave (male)
      expect(genderFiltered).toHaveLength(3);
      expect(genderFiltered.map((u) => u.userId)).toContain('signupOnly_Alice');
      expect(genderFiltered.map((u) => u.userId)).toContain('joinedNow_Beth');
      expect(genderFiltered.map((u) => u.userId)).toContain('signupOnly_Carol');
      expect(genderFiltered.map((u) => u.userId)).not.toContain('signupOnly_Dave');

      // Step 2: Matchmaking
      const matchInput = genderFiltered.map((u) => ({ userId: u.userId, answers: u.answers }));
      const results = getTopMatches(currentUserAnswers, matchInput);

      // All 3 gender-compatible users should have match results
      expect(results).toHaveLength(3);
      expect(results.map((r) => r.userId)).toContain('signupOnly_Alice');
      expect(results.map((r) => r.userId)).toContain('joinedNow_Beth');
      expect(results.map((r) => r.userId)).toContain('signupOnly_Carol');

      // All should have valid scores
      results.forEach((r) => {
        expect(r.score).toBeGreaterThan(0);
        expect(r.score).toBeLessThanOrEqual(100);
      });
    });

    it('should produce identical results for a user regardless of their own signup method', () => {
      // If userA signed up via Sign Up and userB signed up via Join Now,
      // they should see the same match pool (minus themselves)
      const answers = makeQuizAnswers();

      const allProfiles = [
        { userId: 'userA_signupOnly', gender: 'Male', sexualPreference: 'Women', answers },
        { userId: 'userB_joinedNow', gender: 'Male', sexualPreference: 'Women', answers },
        { userId: 'userC_female', gender: 'Female', sexualPreference: 'Men', answers },
        { userId: 'userD_female', gender: 'Female', sexualPreference: 'Men', answers },
      ];

      // UserA's perspective
      const userAProfile = { gender: 'Male', sexualPreference: 'Women' };
      const othersForA = allProfiles.filter((p) => p.userId !== 'userA_signupOnly');
      const filteredForA = filterByGenderPreference(userAProfile, othersForA);
      const matchInputA = filteredForA.map((u) => ({ userId: u.userId, answers: u.answers }));
      const resultsA = getTopMatches(answers, matchInputA);

      // UserB's perspective
      const userBProfile = { gender: 'Male', sexualPreference: 'Women' };
      const othersForB = allProfiles.filter((p) => p.userId !== 'userB_joinedNow');
      const filteredForB = filterByGenderPreference(userBProfile, othersForB);
      const matchInputB = filteredForB.map((u) => ({ userId: u.userId, answers: u.answers }));
      const resultsB = getTopMatches(answers, matchInputB);

      // Both should see the same female users
      expect(filteredForA.map((u) => u.userId)).toContain('userC_female');
      expect(filteredForA.map((u) => u.userId)).toContain('userD_female');
      expect(filteredForB.map((u) => u.userId)).toContain('userC_female');
      expect(filteredForB.map((u) => u.userId)).toContain('userD_female');

      // Same number of matches
      expect(resultsA).toHaveLength(2);
      expect(resultsB).toHaveLength(2);

      // Same scores for the same users
      const userCScoreFromA = resultsA.find((r) => r.userId === 'userC_female')?.score;
      const userCScoreFromB = resultsB.find((r) => r.userId === 'userC_female')?.score;
      expect(userCScoreFromA).toBe(userCScoreFromB);
    });
  });
});
