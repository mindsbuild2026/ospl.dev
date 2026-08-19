/**
 * Standalone unit test runner for Community Rating System calculation and formatting.
 */

import assert from 'node:assert';
import { PromptRatingSummary, RatingDistribution } from '../types';

/**
 * Pure rating calculation logic to verify math & formatting rules
 */
export function calculateRatingSummary(
  ratings: Array<{ userId: string; rating: number }>,
  currentUserId?: string
): PromptRatingSummary {
  const ratingCount = ratings.length;
  
  if (ratingCount === 0) {
    return {
      averageRating: null,
      ratingCount: 0,
      userRating: null,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of ratings) {
    const val = Math.max(1, Math.min(5, Math.round(r.rating)));
    const key = val as 1 | 2 | 3 | 4 | 5;
    distribution[key] = (distribution[key] || 0) + 1;
    sum += val;
  }

  const averageRating = Number((sum / ratingCount).toFixed(1));

  let userRating: number | null = null;
  if (currentUserId) {
    const userRow = ratings.find((r) => r.userId === currentUserId);
    if (userRow) {
      userRating = userRow.rating;
    }
  }

  return {
    averageRating,
    ratingCount,
    userRating,
    distribution,
  };
}

/**
 * Pure UI display string formatter
 */
export function formatCommunityRatingDisplay(summary: PromptRatingSummary): string {
  if (summary.ratingCount === 0 || summary.averageRating === null) {
    return "No ratings yet";
  }
  return `${summary.averageRating.toFixed(1)} / 5.0`;
}

function runTests() {
  console.log('Running Community Rating System Unit Tests...\n');

  // Test 1: New prompt with zero ratings
  const summary1 = calculateRatingSummary([]);
  assert.strictEqual(summary1.ratingCount, 0, 'Test 1 Failed: ratingCount should be 0');
  assert.strictEqual(summary1.averageRating, null, 'Test 1 Failed: averageRating should be null');
  assert.strictEqual(formatCommunityRatingDisplay(summary1), "No ratings yet", 'Test 1 Failed: UI display should be "No ratings yet"');
  console.log('✓ Test 1 Passed: Zero ratings return null average and "No ratings yet"');

  // Test 2: Single 5-star rating
  const summary2 = calculateRatingSummary([{ userId: 'u1', rating: 5 }]);
  assert.strictEqual(summary2.ratingCount, 1, 'Test 2 Failed: ratingCount should be 1');
  assert.strictEqual(summary2.averageRating, 5.0, 'Test 2 Failed: averageRating should be 5.0');
  assert.strictEqual(formatCommunityRatingDisplay(summary2), "5.0 / 5.0", 'Test 2 Failed: UI display should be "5.0 / 5.0"');
  console.log('✓ Test 2 Passed: Single 5-star rating returns 5.0 / 5.0');

  // Test 3: Multiple ratings (5, 4, 3, 5) -> 4.25 -> 4.3
  const summary3 = calculateRatingSummary([
    { userId: 'u1', rating: 5 },
    { userId: 'u2', rating: 4 },
    { userId: 'u3', rating: 3 },
    { userId: 'u4', rating: 5 },
  ]);
  assert.strictEqual(summary3.ratingCount, 4, 'Test 3 Failed: ratingCount should be 4');
  assert.strictEqual(summary3.averageRating, 4.3, 'Test 3 Failed: averageRating should be 4.3');
  assert.strictEqual(formatCommunityRatingDisplay(summary3), "4.3 / 5.0", 'Test 3 Failed: UI display should be "4.3 / 5.0"');
  console.log('✓ Test 3 Passed: Multiple ratings calculate to 4.3 / 5.0');

  // Test 4: User updating rating does not duplicate rating count
  const initialRatings = [
    { userId: 'u1', rating: 5 },
    { userId: 'u2', rating: 3 },
  ];
  const updatedRatings = initialRatings.map(r => r.userId === 'u1' ? { ...r, rating: 4 } : r);
  const summary4 = calculateRatingSummary(updatedRatings, 'u1');
  assert.strictEqual(summary4.ratingCount, 2, 'Test 4 Failed: ratingCount should remain 2');
  assert.strictEqual(summary4.averageRating, 3.5, 'Test 4 Failed: averageRating should be 3.5');
  assert.strictEqual(summary4.userRating, 4, 'Test 4 Failed: userRating should be 4');
  console.log('✓ Test 4 Passed: Rating update preserves count and updates user rating');

  // Test 5: Rating breakdown distribution
  const summary5 = calculateRatingSummary([
    { userId: 'u1', rating: 5 },
    { userId: 'u2', rating: 5 },
    { userId: 'u3', rating: 4 },
    { userId: 'u4', rating: 1 },
  ]);
  assert.strictEqual(summary5.distribution[5], 2, 'Test 5 Failed: 5-star count should be 2');
  assert.strictEqual(summary5.distribution[4], 1, 'Test 5 Failed: 4-star count should be 1');
  assert.strictEqual(summary5.distribution[3], 0, 'Test 5 Failed: 3-star count should be 0');
  assert.strictEqual(summary5.distribution[2], 0, 'Test 5 Failed: 2-star count should be 0');
  assert.strictEqual(summary5.distribution[1], 1, 'Test 5 Failed: 1-star count should be 1');
  console.log('✓ Test 5 Passed: Star distribution breakdown is accurate');

  console.log('\nAll Community Rating tests passed successfully!');
}

runTests();
