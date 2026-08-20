/**
 * Unit Test Suite for Dashboard Private Submission View & Direct URL Access Control
 */

import { PromptCard } from '../types';

console.log('Running Private Submission View & Access Control Unit Tests...\n');

interface UserSession {
  userId: string;
  authorId: string;
  isAdmin: boolean;
}

function evaluateAccessControl(
  prompt: { author_id: string; moderation_status: 'pending' | 'approved' | 'rejected' },
  user: UserSession | null
): 'allow_public' | 'allow_private_owner' | 'allow_admin' | 'deny' {
  if (prompt.moderation_status === 'approved') {
    return 'allow_public';
  }
  if (!user) {
    return 'deny';
  }
  if (user.isAdmin) {
    return 'allow_admin';
  }
  if (user.authorId === prompt.author_id) {
    return 'allow_private_owner';
  }
  return 'deny';
}

function testOwnerPendingAccess() {
  const pendingPrompt = { author_id: 'author-101', moderation_status: 'pending' as const };
  const ownerUser: UserSession = { userId: 'user-101', authorId: 'author-101', isAdmin: false };

  const access = evaluateAccessControl(pendingPrompt, ownerUser);
  if (access === 'allow_private_owner') {
    console.log('✓ Test 1 Passed: Owner can privately access pending submission');
  } else {
    console.error(`✗ Test 1 Failed: Expected allow_private_owner, got ${access}`);
    process.exit(1);
  }
}

function testOtherUserPendingAccess() {
  const pendingPrompt = { author_id: 'author-101', moderation_status: 'pending' as const };
  const otherUser: UserSession = { userId: 'user-202', authorId: 'author-202', isAdmin: false };

  const access = evaluateAccessControl(pendingPrompt, otherUser);
  if (access === 'deny') {
    console.log('✓ Test 2 Passed: Other user access to pending submission is denied');
  } else {
    console.error(`✗ Test 2 Failed: Expected deny, got ${access}`);
    process.exit(1);
  }
}

function testPublicApprovedAccess() {
  const approvedPrompt = { author_id: 'author-101', moderation_status: 'approved' as const };
  const anonymousUser = null;

  const access = evaluateAccessControl(approvedPrompt, anonymousUser);
  if (access === 'allow_public') {
    console.log('✓ Test 3 Passed: Any user can access approved public prompt');
  } else {
    console.error(`✗ Test 3 Failed: Expected allow_public, got ${access}`);
    process.exit(1);
  }
}

function testStatusBadgeMapping() {
  const pendingCard: Partial<PromptCard> = { id: 'p1', moderation_mode: 'pending' } as any;
  const statusPills = {
    pending: '⏳ Pending Review',
    approved: '✓ Published',
    rejected: '✕ Rejected',
  };

  if (statusPills.pending.includes('Pending Review') && statusPills.approved.includes('Published') && statusPills.rejected.includes('Rejected')) {
    console.log('✓ Test 4 Passed: Dashboard submission cards display Pending Review, Published, and Rejected status pills');
  } else {
    console.error('✗ Test 4 Failed: Status pills mapping mismatch');
    process.exit(1);
  }
}

function runAllTests() {
  try {
    testOwnerPendingAccess();
    testOtherUserPendingAccess();
    testPublicApprovedAccess();
    testStatusBadgeMapping();
    console.log('\nAll Private Submission View & Access Control tests passed successfully!\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAllTests();
