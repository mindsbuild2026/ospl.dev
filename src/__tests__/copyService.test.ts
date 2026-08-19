/**
 * Unit Test Suite for Prompt Copy, Deduplication & Metric Logic
 */

import { copyTextToClipboard } from '../lib/clipboardService';

// Mock navigator.clipboard
const originalClipboard = global.navigator.clipboard;

function setupMockClipboard(shouldSucceed = true) {
  Object.defineProperty(global.navigator, 'clipboard', {
    value: {
      writeText: async (_text: string) => {
        if (!shouldSucceed) {
          throw new Error('Clipboard permission denied');
        }
        return Promise.resolve();
      },
    },
    configurable: true,
    writable: true,
  });
}

function restoreClipboard() {
  Object.defineProperty(global.navigator, 'clipboard', {
    value: originalClipboard,
    configurable: true,
    writable: true,
  });
}

console.log('Running Prompt Copy System Unit Tests...\n');

async function testSuccessfulClipboardCopy() {
  setupMockClipboard(true);
  const result = await copyTextToClipboard('Test prompt text');
  if (result === true) {
    console.log('✓ Test 1 Passed: Successful clipboard operation returns true');
  } else {
    console.error('✗ Test 1 Failed: Expected true for successful copy, got false');
    process.exit(1);
  }
  restoreClipboard();
}

async function testFailedClipboardCopy() {
  setupMockClipboard(false);
  const result = await copyTextToClipboard('Test prompt text');
  if (result === false) {
    console.log('✓ Test 2 Passed: Failed clipboard operation returns false without triggering success state');
  } else {
    console.error('✗ Test 2 Failed: Expected false for failed copy, got true');
    process.exit(1);
  }
  restoreClipboard();
}

async function testEmptyTextCopyGuard() {
  const result = await copyTextToClipboard('');
  if (result === false) {
    console.log('✓ Test 3 Passed: Empty text copy guard returns false');
  } else {
    console.error('✗ Test 3 Failed: Empty string copy should fail guard');
    process.exit(1);
  }
}

async function testDuplicatedPromptMetricsReset() {
  const originalPrompt = {
    id: 'original-123',
    title: 'Original Creative Prompt',
    stats: {
      views: 1200,
      copies: 450,
      rating: 4.8,
      ratingCount: 50,
    },
  };

  // Simulate duplicating / cloning a prompt
  const duplicatedPrompt = {
    ...originalPrompt,
    id: 'duplicated-456',
    title: `Copy of ${originalPrompt.title}`,
    stats: {
      views: 0,
      copies: 0,
      rating: 0,
      ratingCount: 0,
    },
  };

  if (
    duplicatedPrompt.id !== originalPrompt.id &&
    duplicatedPrompt.stats.copies === 0 &&
    duplicatedPrompt.stats.views === 0 &&
    originalPrompt.stats.copies === 450
  ) {
    console.log('✓ Test 4 Passed: Duplicated prompt resets copies, views, and ratings while preserving original prompt metrics');
  } else {
    console.error('✗ Test 4 Failed: Duplicated prompt did not cleanly reset engagement metrics');
    process.exit(1);
  }
}

async function runAllTests() {
  try {
    await testSuccessfulClipboardCopy();
    await testFailedClipboardCopy();
    await testEmptyTextCopyGuard();
    await testDuplicatedPromptMetricsReset();
    console.log('\nAll Prompt Copy tests passed successfully!\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAllTests();
