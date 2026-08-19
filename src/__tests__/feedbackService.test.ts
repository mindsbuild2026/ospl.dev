/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Automated tests for Feedback Validation and Payload Logic.
 */

import { validateFeedbackForm, isValidEmail } from '../lib/feedbackValidation';
import { CreateFeedbackPayload } from '../types';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('\n--- Running Feedback Validation Tests ---');

  // Test 1: Email Validation
  assert(isValidEmail('user@example.com') === true, 'Valid email passes format check');
  assert(isValidEmail('invalid-email') === false, 'Invalid email fails format check');
  assert(isValidEmail('') === false, 'Empty email fails format check');

  // Test 2: Valid Feedback Payload
  const validPayload: CreateFeedbackPayload = {
    type: 'bug',
    message: 'This is a valid bug report description that is longer than 5 chars.',
    rating: 5,
    contact_email: 'user@test.com',
  };
  const validResult = validateFeedbackForm(validPayload);
  assert(validResult.isValid === true, 'Valid feedback payload passes validation');
  assert(Object.keys(validResult.errors).length === 0, 'Valid payload has 0 errors');

  // Test 3: Invalid Type
  const invalidTypePayload: CreateFeedbackPayload = {
    type: 'invalid_type' as any,
    message: 'Valid message length here.',
  };
  const invalidTypeResult = validateFeedbackForm(invalidTypePayload);
  assert(invalidTypeResult.isValid === false, 'Invalid type fails validation');
  assert(Boolean(invalidTypeResult.errors.type), 'Invalid type sets type error message');

  // Test 4: Too Short Message
  const shortMessagePayload: CreateFeedbackPayload = {
    type: 'feature',
    message: 'Hey',
  };
  const shortResult = validateFeedbackForm(shortMessagePayload);
  assert(shortResult.isValid === false, 'Short message (<5 chars) fails validation');
  assert(Boolean(shortResult.errors.message), 'Short message sets message error');

  // Test 5: Too Long Message
  const longMessagePayload: CreateFeedbackPayload = {
    type: 'general',
    message: 'a'.repeat(2001),
  };
  const longResult = validateFeedbackForm(longMessagePayload);
  assert(longResult.isValid === false, 'Excessively long message (>2000 chars) fails validation');
  assert(Boolean(longResult.errors.message), 'Long message sets message error');

  // Test 6: Invalid Rating Range
  const invalidRatingPayload: CreateFeedbackPayload = {
    type: 'improvement',
    message: 'Great app overall!',
    rating: 10,
  };
  const invalidRatingResult = validateFeedbackForm(invalidRatingPayload);
  assert(invalidRatingResult.isValid === false, 'Rating out of 1-5 range fails validation');
  assert(Boolean(invalidRatingResult.errors.rating), 'Invalid rating sets rating error');

  // Test 7: Invalid Optional Email
  const invalidEmailPayload: CreateFeedbackPayload = {
    type: 'other',
    message: 'Feedback message here.',
    contact_email: 'not-an-email',
  };
  const invalidEmailResult = validateFeedbackForm(invalidEmailPayload);
  assert(invalidEmailResult.isValid === false, 'Invalid contact email fails validation');
  assert(Boolean(invalidEmailResult.errors.contact_email), 'Invalid contact email sets contact_email error');

  console.log(`\nSummary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
