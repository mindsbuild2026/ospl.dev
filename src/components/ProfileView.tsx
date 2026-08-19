/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Globe, Github, ShieldCheck, Check, AlertCircle, ArrowLeft, Loader2, Sparkles, Hash } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { LookupAuthor } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  user: SupabaseUser | null;
  author: LookupAuthor | null;
  onBack: () => void;
  updateAuthorProfile: (updates: Partial<LookupAuthor>) => Promise<void>;
}

export default function ProfileView({
  user,
  author,
  onBack,
  updateAuthorProfile,
}: ProfileViewProps) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Hydrate fields from author record
  useEffect(() => {
    if (author) {
      setName(author.name || '');
      setHandle(author.handle || '');
      setBio(author.bio || '');
      setWebsite(author.website || '');
      setAvatarUrl(author.avatar_url || '');
    }
  }, [author]);

  if (!user || !author) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20 mx-auto mb-6">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-text dark:text-white">Access Denied</h2>
        <p className="text-sm text-neutral-500 mt-3 max-w-sm mx-auto">Please sign in with your GitHub account to access and manage your profile settings.</p>
        <button
          onClick={onBack}
          className="mt-8 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-full font-sans text-xs font-bold uppercase tracking-wider transition-colors hover:bg-brand-accent hover:text-white cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const validateInputs = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    // 1. Display Name validation
    if (!name.trim()) {
      errors.name = 'Display Name is required.';
    }

    // 2. Username (handle) validation
    const handleVal = handle.trim();
    if (!handleVal) {
      errors.handle = 'Username is required.';
    } else {
      // Must match handle regex
      const handleRegex = /^@?[A-Za-z0-9_.-]+$/;
      if (!handleRegex.test(handleVal)) {
        errors.handle = 'Username can only contain letters, numbers, underscores, dots, and dashes.';
      } else if (handleVal === '@') {
        errors.handle = 'Username is invalid.';
      }
    }

    // 3. Website URL validation
    if (website.trim()) {
      try {
        new URL(website.trim());
      } catch {
        errors.website = 'Please enter a valid website URL (including http:// or https://).';
      }
    }

    // 4. Avatar URL validation
    if (avatarUrl.trim()) {
      try {
        new URL(avatarUrl.trim());
      } catch {
        errors.avatar_url = 'Please enter a valid avatar image URL.';
      }
    }

    // 5. Database check for handle uniqueness if handle changed
    if (!errors.handle && handleVal !== author.handle && supabase) {
      try {
        const { data, error } = await supabase
          .from('authors')
          .select('id')
          .eq('handle', handleVal)
          .neq('id', author.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          errors.handle = 'This username is already taken.';
        }
      } catch (err) {
        console.error('Uniqueness check error:', err);
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setErrorMessage('');
    setFormErrors({});

    const isValid = await validateInputs();
    if (!isValid) return;

    setStatus('saving');
    try {
      // Enforce leading '@' on username (handle) if not present
      let formattedHandle = handle.trim();
      if (!formattedHandle.startsWith('@')) {
        formattedHandle = `@${formattedHandle}`;
      }

      await updateAuthorProfile({
        name: name.trim(),
        handle: formattedHandle,
        bio: bio.trim(),
        website: website.trim(),
        avatar_url: avatarUrl.trim(),
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred while saving profile.');
      setStatus('error');
    }
  };

  // Format account creation date
  const createdDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) 
    : 'Unknown';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col justify-center">
      {/* Header Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-brand-text dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-1.5 bg-brand-accent/5 dark:bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/15">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Creator Center</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Glassmorphic Profile Preview Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[32px] border border-neutral-200/50 bg-white/80 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:border-neutral-800/80 dark:bg-neutral-900/40 backdrop-blur-md text-center">
            {/* Ambient Accent Glows */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-accent/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Profile Avatar Frame */}
            <div className="relative mx-auto w-24 h-24 mb-4 select-none">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-accent p-0.5 shadow-md bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                {avatarUrl.trim() ? (
                  <img
                    src={avatarUrl.trim()}
                    alt={name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-brand-accent/20 to-purple-505/20 text-brand-text dark:text-white flex items-center justify-center font-display font-black text-2xl">
                    {name?.slice(0, 2).toUpperCase() || 'CR'}
                  </div>
                )}
              </div>
              {author.verified && (
                <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full border-2 border-white dark:border-neutral-900" title="Verified Creator">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>

            <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white truncate">{name || 'New Creator'}</h3>
            <p className="font-mono text-xs text-brand-accent mt-0.5 select-all">{handle || '@creator'}</p>
            
            {bio.trim() && (
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed px-2 text-left italic">
                "{bio}"
              </p>
            )}

            {/* Microstats */}
            <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-around text-center select-none">
              <div>
                <span className="block font-display text-sm font-black text-neutral-900 dark:text-white">{author.reputation || 0}</span>
                <span className="text-[10px] text-neutral-450 dark:text-neutral-500 uppercase font-bold tracking-wider">Reputation</span>
              </div>
              <div className="w-px h-6 bg-neutral-200/50 dark:bg-neutral-800/80" />
              <div>
                <span className="block font-display text-sm font-black text-neutral-900 dark:text-white">Creator</span>
                <span className="text-[10px] text-neutral-450 dark:text-neutral-500 uppercase font-bold tracking-wider">Rank</span>
              </div>
            </div>
          </div>

          {/* Read-Only Credentials Section */}
          <div className="rounded-[28px] border border-neutral-200/50 bg-white/60 p-6 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/20 backdrop-blur-sm">
            <h4 className="font-display text-xs font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider mb-4">Credentials (Read-only)</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-400 dark:text-neutral-500 shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">Creator Account ID</span>
                  <span className="text-xs font-mono text-neutral-700 dark:text-neutral-350 truncate block select-all">{author.user_id || user?.id || 'Not Associated'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-400 dark:text-neutral-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">OAuth Email</span>
                  <span className="text-xs font-sans text-neutral-700 dark:text-neutral-350 truncate block select-all">{user.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-400 dark:text-neutral-500 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">Member Since</span>
                  <span className="text-xs font-sans text-neutral-700 dark:text-neutral-350 truncate block">{createdDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[32px] border border-neutral-200/50 bg-white/80 p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:border-neutral-800/80 dark:bg-neutral-900/40 backdrop-blur-md">
            <h3 className="font-display text-2xl font-black text-neutral-900 dark:text-white tracking-tight mb-1">Creator Settings</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-450 mb-6">Customize how you appear across the PromptHub library ecosystem.</p>

            {/* Save Status Banners */}
            {status === 'success' && (
              <div className="mb-6 rounded-2xl border border-emerald-250 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>Profile updated successfully! All configurations are stored securely.</span>
              </div>
            )}

            {status === 'error' && errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      disabled={status === 'saving'}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Prompt Master"
                      className={`w-full bg-transparent border rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-900 dark:text-white transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 ${
                        formErrors.name ? 'border-red-400 bg-red-50/5 focus:border-red-400 focus:ring-red-400/5' : 'border-neutral-250 dark:border-neutral-800'
                      }`}
                    />
                  </div>
                  {formErrors.name && <p className="text-xs text-red-650 mt-1">{formErrors.name}</p>}
                </div>

                {/* Username handle Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={handle}
                      disabled={status === 'saving'}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g. @promptmaster"
                      className={`w-full bg-transparent border rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-900 dark:text-white transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 font-mono ${
                        formErrors.handle ? 'border-red-400 bg-red-50/5 focus:border-red-400 focus:ring-red-400/5' : 'border-neutral-250 dark:border-neutral-800'
                      }`}
                    />
                  </div>
                  {formErrors.handle && <p className="text-xs text-red-650 mt-1">{formErrors.handle}</p>}
                </div>
              </div>

              {/* Bio Textarea */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                  Bio Description
                </label>
                <textarea
                  value={bio}
                  disabled={status === 'saving'}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief details about your AI prompt engineering skills or creative domains..."
                  rows={4}
                  className="w-full bg-transparent border border-neutral-250 dark:border-neutral-800 rounded-xl py-3 px-4 text-sm text-neutral-900 dark:text-white transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 resize-none"
                />
              </div>

              {/* Website Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                  Website Portfolio
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={website}
                    disabled={status === 'saving'}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. https://portfolio.my.com"
                    className={`w-full bg-transparent border rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-900 dark:text-white transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 ${
                      formErrors.website ? 'border-red-400 bg-red-50/5 focus:border-red-400 focus:ring-red-400/5' : 'border-neutral-250 dark:border-neutral-800'
                    }`}
                  />
                </div>
                {formErrors.website && <p className="text-xs text-red-650 mt-1">{formErrors.website}</p>}
              </div>

              {/* Avatar URL Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                  Avatar Image URL (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={avatarUrl}
                    disabled={status === 'saving'}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="e.g. https://images.com/myphoto.jpg"
                    className={`w-full bg-transparent border rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-900 dark:text-white transition-all focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 ${
                      formErrors.avatar_url ? 'border-red-400 bg-red-50/5 focus:border-red-400 focus:ring-red-400/5' : 'border-neutral-250 dark:border-neutral-800'
                    }`}
                  />
                </div>
                {formErrors.avatar_url && <p className="text-xs text-red-650 mt-1">{formErrors.avatar_url}</p>}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                onClick={onBack}
                disabled={status === 'saving'}
                className="px-5 py-2.5 border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 text-xs font-bold uppercase tracking-wider rounded-xl transition disabled:opacity-50 cursor-pointer bg-transparent"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={status === 'saving'}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-1.5"
              >
                {status === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
