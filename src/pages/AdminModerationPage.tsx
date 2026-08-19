/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AdminModerationView from '../components/AdminModerationView';
import { isCurrentUserAdmin } from '../lib/moderationService';

export default function AdminModerationPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {/* Loading Spinner */}
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm" role="alert">
          Access denied. You do not have permission to access the moderation dashboard.
        </div>
      </div>
    );
  }

  return <AdminModerationView />;
}
