/**
 * Standalone unit test runner for User Reputation Points System.
 */

import assert from 'node:assert';

export interface TestAuthor {
  id: string;
  userId: string;
  verified: boolean;
}

export interface TestPrompt {
  id: string;
  authorId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  workflowStepsCount?: number;
}

export interface TestRating {
  promptId: string;
  userId: string;
  ratingValue: number;
}

export interface TestAdminAdjustment {
  authorId: string;
  points: number;
  reason: string;
}

/**
 * Pure reputation calculation logic matching database RPC rules
 */
export function calculateAuthorReputation(
  author: TestAuthor,
  prompts: TestPrompt[],
  ratings: TestRating[],
  adjustments: TestAdminAdjustment[] = []
): number {
  // Filter approved prompts for this author
  const approvedPrompts = prompts.filter(
    (p) => p.authorId === author.id && p.status === 'approved'
  );
  const approvedCount = approvedPrompts.length;

  const approvedPromptIds = new Set(approvedPrompts.map((p) => p.id));

  // Filter ratings received from OTHER users on approved prompts
  const validRatings = ratings.filter(
    (r) => approvedPromptIds.has(r.promptId) && r.userId !== author.userId
  );

  const fiveStarCount = validRatings.filter((r) => r.ratingValue === 5).length;
  const fourStarCount = validRatings.filter((r) => r.ratingValue === 4).length;

  const verifiedBonus = author.verified ? 100 : 0;

  const adminAdjustmentsTotal = adjustments
    .filter((a) => a.authorId === author.id)
    .reduce((sum, a) => sum + a.points, 0);

  const total = (approvedCount * 50) + (fiveStarCount * 10) + (fourStarCount * 5) + verifiedBonus + adminAdjustmentsTotal;

  return Math.max(0, total);
}

function runReputationTests() {
  console.log('Running User Reputation System Unit Tests...\n');

  const author: TestAuthor = { id: 'author_1', userId: 'user_1', verified: false };

  // Test 1: New author with 0 approved prompts, 0 ratings -> 0 pts
  const rep1 = calculateAuthorReputation(author, [], []);
  assert.strictEqual(rep1, 0, 'Test 1 Failed: Reputation should be 0 for new author');
  console.log('✓ Test 1 Passed: New author starts at 0 points');

  // Test 2: Draft, Pending, and Rejected prompts earn 0 points
  const unapprovedPrompts: TestPrompt[] = [
    { id: 'p1', authorId: 'author_1', status: 'draft' },
    { id: 'p2', authorId: 'author_1', status: 'pending' },
    { id: 'p3', authorId: 'author_1', status: 'rejected' },
  ];
  const rep2 = calculateAuthorReputation(author, unapprovedPrompts, []);
  assert.strictEqual(rep2, 0, 'Test 2 Failed: Unapproved prompts must earn 0 points');
  console.log('✓ Test 2 Passed: Draft, Pending, and Rejected content earn 0 points');

  // Test 3: Approved prompt earns +50 pts (Casual & Developer Pro equal)
  const approvedPrompts: TestPrompt[] = [
    { id: 'p_casual', authorId: 'author_1', status: 'approved', workflowStepsCount: 1 },
    { id: 'p_pro', authorId: 'author_1', status: 'approved', workflowStepsCount: 10 },
  ];
  const rep3 = calculateAuthorReputation(author, approvedPrompts, []);
  assert.strictEqual(rep3, 100, 'Test 3 Failed: 2 approved prompts must earn 100 points (50 x 2)');
  console.log('✓ Test 3 Passed: Approved prompts earn +50 pts each regardless of workflow step count');

  // Test 4: Ratings received from other users earn +10 for 5★ and +5 for 4★
  const ratings: TestRating[] = [
    { promptId: 'p_casual', userId: 'user_2', ratingValue: 5 }, // +10
    { promptId: 'p_casual', userId: 'user_3', ratingValue: 4 }, // +5
    { promptId: 'p_casual', userId: 'user_4', ratingValue: 3 }, // 0
  ];
  const rep4 = calculateAuthorReputation(author, approvedPrompts, ratings);
  assert.strictEqual(rep4, 115, 'Test 4 Failed: 100 (prompts) + 10 (5★) + 5 (4★) should equal 115');
  console.log('✓ Test 4 Passed: 5-Star ratings earn +10 pts and 4-Star ratings earn +5 pts');

  // Test 5: Self-rating earns 0 points
  const selfRating: TestRating[] = [
    { promptId: 'p_casual', userId: 'user_1', ratingValue: 5 }, // Self-rating from author_1
  ];
  const rep5 = calculateAuthorReputation(author, approvedPrompts, selfRating);
  assert.strictEqual(rep5, 100, 'Test 5 Failed: Self-ratings must earn 0 points');
  console.log('✓ Test 5 Passed: Self-rating earns 0 points (anti-abuse protection)');

  // Test 6: Rating update (5★ -> 4★) recalculates score deterministically without duplicate points
  const updatedRatings: TestRating[] = [
    { promptId: 'p_casual', userId: 'user_2', ratingValue: 4 }, // Updated from 5★ to 4★ (+5)
  ];
  const rep6 = calculateAuthorReputation(author, approvedPrompts, updatedRatings);
  assert.strictEqual(rep6, 105, 'Test 6 Failed: Updated rating 5★->4★ should calculate 100 + 5 = 105');
  console.log('✓ Test 6 Passed: Rating update recalculates points deterministically');

  // Test 7: Verified Author bonus (+100 pts) & Admin Adjustments
  const verifiedAuthor: TestAuthor = { id: 'author_1', userId: 'user_1', verified: true };
  const adminAdjustments: TestAdminAdjustment[] = [
    { authorId: 'author_1', points: 25, reason: 'Community contribution award' },
  ];
  const rep7 = calculateAuthorReputation(verifiedAuthor, approvedPrompts, updatedRatings, adminAdjustments);
  // 100 (prompts) + 5 (4★) + 100 (verified) + 25 (admin) = 230
  assert.strictEqual(rep7, 230, 'Test 7 Failed: 100 + 5 + 100 + 25 should equal 230');
  console.log('✓ Test 7 Passed: Verified status (+100) and Admin adjustments (+25) calculate correctly');

  console.log('\nAll User Reputation System tests passed successfully!');
}

runReputationTests();
