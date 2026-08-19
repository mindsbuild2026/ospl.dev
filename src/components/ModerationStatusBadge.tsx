/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ModerationInfo } from '../types';

interface ModerationStatusBadgeProps {
  status: ModerationInfo;
  showRejectionReason?: boolean;
}

export default function ModerationStatusBadge({
  status,
  showRejectionReason = false,
}: ModerationStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeStyles = (statusStr: string): string => {
    switch (statusStr) {
      case 'approved':
        return 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100';
      case 'pending':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100';
      case 'rejected':
        return 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100';
      default:
        return 'border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100';
    }
  };

  const getLabel = (statusStr: string): string => {
    switch (statusStr) {
      case 'approved':
        return '✓ Approved';
      case 'pending':
        return '⏳ Pending Review';
      case 'rejected':
        return '✗ Rejected';
      default:
        return statusStr;
    }
  };

  const getTooltipText = (statusInfo: ModerationInfo): string => {
    switch (statusInfo.status) {
      case 'approved':
        return `Approved${statusInfo.approvedAt ? ` on ${new Date(statusInfo.approvedAt).toLocaleDateString()}` : ''}`;
      case 'pending':
        return `Awaiting admin approval${statusInfo.submittedAt ? ` (submitted ${new Date(statusInfo.submittedAt).toLocaleDateString()})` : ''}`;
      case 'rejected':
        return 'This prompt was rejected and archived';
      default:
        return '';
    }
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors duration-200 ${getBadgeStyles(
          status.status
        )}`}
      >
        {getLabel(status.status)}
      </span>

      {/* Tooltip implementation */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-neutral-900 text-white text-xs rounded py-1.5 px-3 z-50 pointer-events-none shadow-md transition-opacity duration-200">
          {getTooltipText(status)}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-width-[5px] border-solid border-transparent border-t-neutral-900" style={{ borderWidth: '5px', borderColor: '#171717 transparent transparent transparent' }} />
        </div>
      )}
    </div>
  );
}
