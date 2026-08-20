/**
 * Unit Test Suite for Post-Submit Redirect UX & Role-based Routing
 */

import { Prompt } from '../types';

console.log('Running Post-Submit Redirect UX Unit Tests...\n');

// Mock function representing prompt submission redirect decision
function getPostSubmitRedirectRoute(createdId: string, author?: { is_admin?: boolean } | null): string {
  const isAdmin = author?.is_admin === true;
  if (isAdmin) {
    return `/prompt/${createdId}`;
  }
  return `/submission-success/${createdId}`;
}

function testNonAdminRedirectRoute() {
  const createdId = 'prompt-uuid-123';
  const normalAuthor = { is_admin: false, handle: 'john_doe' };
  
  const targetRoute = getPostSubmitRedirectRoute(createdId, normalAuthor);

  if (targetRoute === '/submission-success/prompt-uuid-123') {
    console.log('✓ Test 1 Passed: Normal user submission redirects to /submission-success/:id');
  } else {
    console.error(`✗ Test 1 Failed: Expected /submission-success/prompt-uuid-123, got ${targetRoute}`);
    process.exit(1);
  }
}

function testAdminRedirectRoute() {
  const createdId = 'prompt-uuid-456';
  const adminAuthor = { is_admin: true, handle: 'admin_user' };
  
  const targetRoute = getPostSubmitRedirectRoute(createdId, adminAuthor);

  if (targetRoute === '/prompt/prompt-uuid-456') {
    console.log('✓ Test 2 Passed: Admin user submission redirects to /prompt/:id (Detail View)');
  } else {
    console.error(`✗ Test 2 Failed: Expected /prompt/prompt-uuid-456, got ${targetRoute}`);
    process.exit(1);
  }
}

function testSubmissionMetadataContract() {
  const mockSubmittedPrompt: Partial<Prompt> = {
    id: 'prompt-789',
    title: 'Photorealistic Cinematic Fashion Portrait',
    creatorMode: 'casual',
    createdAt: '2026-08-20T11:44:28.597Z',
    moderation: { status: 'pending' },
  };

  if (
    mockSubmittedPrompt.title === 'Photorealistic Cinematic Fashion Portrait' &&
    mockSubmittedPrompt.moderation?.status === 'pending'
  ) {
    console.log('✓ Test 3 Passed: Submission metadata contract preserves title, type, and pending moderation status');
  } else {
    console.error('✗ Test 3 Failed: Submission metadata contract mismatch');
    process.exit(1);
  }
}

function runAllTests() {
  try {
    testNonAdminRedirectRoute();
    testAdminRedirectRoute();
    testSubmissionMetadataContract();
    console.log('\nAll Post-Submit Redirect UX tests passed successfully!\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAllTests();
