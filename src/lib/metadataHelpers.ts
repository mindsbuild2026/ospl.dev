/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Metadata display utilities and helpers
 */

/**
 * Format token count for display (e.g., "~320 tokens", "1.2K tokens")
 */
export function formatTokenCount(tokens: number | undefined): string {
  if (!tokens) return '';
  if (tokens >= 1000) {
    return `~${(tokens / 1000).toFixed(1)}K tokens`;
  }
  return `~${Math.round(tokens / 10) * 10} tokens`;
}

/**
 * Format reading time in seconds to human-readable format
 */
export function formatReadingTime(seconds: number | undefined): string {
  if (!seconds) return '';
  if (seconds < 60) {
    return `${seconds}s read`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}min read`;
}

/**
 * Get color for complexity badge
 */
export function getComplexityColor(complexity: string | undefined): string {
  switch (complexity) {
    case 'Small':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Large':
      return 'bg-orange-100 text-orange-800';
    case 'Very Large':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get icon/emoji for complexity
 */
export function getComplexityEmoji(complexity: string | undefined): string {
  switch (complexity) {
    case 'Small':
      return '🟢';
    case 'Medium':
      return '🟡';
    case 'Large':
      return '🟠';
    case 'Very Large':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Format quality score as percentage with color
 */
export function formatQualityScore(score: number | undefined): { display: string; color: string } {
  if (!score) return { display: '', color: '' };
  
  let color = 'text-red-600';
  if (score >= 80) color = 'text-green-600';
  else if (score >= 60) color = 'text-blue-600';
  else if (score >= 40) color = 'text-yellow-600';
  
  return { display: `${score}% quality`, color };
}

/**
 * Get difficulty level color
 */
export function getDifficultyColor(difficulty: string | undefined): string {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-blue-100 text-blue-800';
    case 'Intermediate':
      return 'bg-purple-100 text-purple-800';
    case 'Advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format traits as display-friendly chips
 */
export function formatTraits(traits: string[] | undefined): string[] {
  if (!traits) return [];
  return traits.map(trait => {
    // Convert snake_case or kebab-case to Title Case
    return trait
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
}

/**
 * Get metadata summary line for card display (e.g., "~320 tokens • Medium • GPT-4, Claude")
 */
export function getMetadataSummary(metadata: {
  estimatedTokens?: number;
  complexity?: string;
  compatibleModels?: string[];
}): string {
  const parts = [];
  
  if (metadata.estimatedTokens) {
    const tokens = metadata.estimatedTokens >= 1000 
      ? `${(metadata.estimatedTokens / 1000).toFixed(1)}K`
      : metadata.estimatedTokens;
    parts.push(`~${tokens} tokens`);
  }
  
  if (metadata.complexity) {
    parts.push(getComplexityEmoji(metadata.complexity) + ' ' + metadata.complexity);
  }
  
  if (metadata.compatibleModels && metadata.compatibleModels.length > 0) {
    parts.push(metadata.compatibleModels.slice(0, 2).join(', '));
  }
  
  return parts.join(' • ');
}
