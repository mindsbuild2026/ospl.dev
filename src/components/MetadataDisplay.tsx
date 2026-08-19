/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Metadata display components for prompts
 */

import React from 'react';
import { getComplexityColor, getComplexityEmoji, getDifficultyColor, formatTraits } from '../lib/metadataHelpers';

interface MetadataChipProps {
  label: string;
  value?: string;
  color?: string;
  emoji?: string;
  className?: string;
}

/**
 * Generic metadata chip/badge component
 */
export function MetadataChip({ label, value, color, emoji, className = '' }: MetadataChipProps) {
  if (!value) return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${color || 'bg-gray-100 text-gray-800'} ${className}`}>
      {emoji && <span>{emoji}</span>}
      <span>{value}</span>
    </span>
  );
}

interface ComplexityBadgeProps {
  complexity?: string;
  className?: string;
}

/**
 * Complexity level badge
 */
export function ComplexityBadge({ complexity, className = '' }: ComplexityBadgeProps) {
  if (!complexity) return null;
  
  return (
    <MetadataChip
      label="Complexity"
      value={complexity}
      color={getComplexityColor(complexity)}
      emoji={getComplexityEmoji(complexity)}
      className={className}
    />
  );
}

interface DifficultyBadgeProps {
  difficulty?: string;
  className?: string;
}

/**
 * Difficulty level badge
 */
export function DifficultyBadge({ difficulty, className = '' }: DifficultyBadgeProps) {
  if (!difficulty) return null;
  
  return (
    <MetadataChip
      label="Difficulty"
      value={difficulty}
      color={getDifficultyColor(difficulty)}
      className={className}
    />
  );
}

interface QualityBadgeProps {
  score?: number;
  className?: string;
}

/**
 * Quality score badge (0-100)
 */
export function QualityBadge({ score, className = '' }: QualityBadgeProps) {
  if (score === undefined || score === null) return null;
  
  let color = 'bg-red-100 text-red-800';
  if (score >= 80) color = 'bg-green-100 text-green-800';
  else if (score >= 60) color = 'bg-blue-100 text-blue-800';
  else if (score >= 40) color = 'bg-yellow-100 text-yellow-800';
  
  return (
    <MetadataChip
      label="Quality"
      value={`${score}%`}
      color={color}
      className={className}
    />
  );
}

interface TraitChipProps {
  trait: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * Individual trait chip (with optional remove button)
 */
export function TraitChip({ trait, onRemove, className = '' }: TraitChipProps) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 ${className}`}>
      <span>{trait}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-indigo-600 hover:text-indigo-800 font-bold"
          aria-label={`Remove ${trait}`}
        >
          ✕
        </button>
      )}
    </span>
  );
}

interface TraitsListProps {
  traits?: string[];
  onRemove?: (trait: string) => void;
  className?: string;
  max?: number;
}

/**
 * List of trait chips
 */
export function TraitsList({ traits, onRemove, className = '', max }: TraitsListProps) {
  if (!traits || traits.length === 0) return null;
  
  const displayedTraits = max ? traits.slice(0, max) : traits;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayedTraits.map((trait) => (
        <TraitChip
          key={trait}
          trait={formatTraits([trait])[0]}
          onRemove={onRemove ? () => onRemove(trait) : undefined}
        />
      ))}
    </div>
  );
}

interface ModelIconsProps {
  models?: string[];
  maxDisplay?: number;
  className?: string;
}

/**
 * Display compatible models as inline text or icons
 */
export function ModelsList({ models, maxDisplay = 3, className = '' }: ModelIconsProps) {
  if (!models || models.length === 0) return null;
  
  const displayed = models.slice(0, maxDisplay);
  const remaining = models.length - maxDisplay;
  
  return (
    <div className={`flex items-center gap-1 text-sm text-gray-700 ${className}`}>
      <span className="font-medium">Compatible:</span>
      {displayed.map((model) => (
        <span key={model} className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-medium">
          {model}
        </span>
      ))}
      {remaining > 0 && (
        <span className="px-2 py-0.5 text-gray-600 text-xs">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

interface TokenCountBadgeProps {
  tokens?: number;
  className?: string;
}

/**
 * Token count badge
 */
export function TokenCountBadge({ tokens, className = '' }: TokenCountBadgeProps) {
  if (!tokens) return null;
  
  const display = tokens >= 1000 
    ? `~${(tokens / 1000).toFixed(1)}K`
    : `~${Math.round(tokens / 10) * 10}`;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 ${className}`}>
      {display} tokens
    </span>
  );
}

interface MetadataGridProps {
  metadata: {
    characterCount?: number;
    wordCount?: number;
    estimatedTokens?: number;
    complexity?: string;
    difficultyLevel?: string;
    structureLevel?: string;
    readingTimeSec?: number;
    qualityScore?: number;
  };
  className?: string;
}

/**
 * Full metadata grid for detail pages
 */
export function MetadataGrid({ metadata, className = '' }: MetadataGridProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {metadata.characterCount !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Characters</div>
          <div className="text-lg font-bold text-gray-900">{metadata.characterCount.toLocaleString()}</div>
        </div>
      )}
      {metadata.wordCount !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Words</div>
          <div className="text-lg font-bold text-gray-900">{metadata.wordCount.toLocaleString()}</div>
        </div>
      )}
      {metadata.estimatedTokens !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Tokens</div>
          <div className="text-lg font-bold text-gray-900">
            {metadata.estimatedTokens >= 1000 
              ? `${(metadata.estimatedTokens / 1000).toFixed(1)}K`
              : metadata.estimatedTokens}
          </div>
        </div>
      )}
      {metadata.readingTimeSec !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Read Time</div>
          <div className="text-lg font-bold text-gray-900">
            {Math.ceil(metadata.readingTimeSec / 60)}min
          </div>
        </div>
      )}
      {metadata.complexity && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Complexity</div>
          <ComplexityBadge complexity={metadata.complexity} />
        </div>
      )}
      {metadata.qualityScore !== undefined && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600">Quality</div>
          <QualityBadge score={metadata.qualityScore} />
        </div>
      )}
    </div>
  );
}
