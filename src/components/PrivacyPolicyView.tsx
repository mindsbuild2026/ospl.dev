/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Privacy Policy Page - PromptHub
 */

import React from 'react';

export default function PrivacyPolicyView() {
  const lastUpdated = 'June 10, 2026';

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 dark:from-brand-accent/5 dark:to-transparent py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Last Updated: <span className="font-semibold">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">Introduction</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            OSPL ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services, including our prompt library, collections, ratings, and AI analysis features.
          </p>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our services. Your continued use of OSPL following the posting of revised Privacy Policy means that you accept and agree to the changes.
          </p>
        </section>

        {/* Information Collected */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Information We Collect</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">1. Account Information</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                When you create an account through GitHub authentication, we collect:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>GitHub user ID and username (handle)</li>
                <li>Your name and avatar from your GitHub profile</li>
                <li>Your GitHub email address (if publicly available)</li>
                <li>Public GitHub profile URL</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">2. Profile Information</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                You may optionally provide additional profile information including:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>Bio/biography text</li>
                <li>Personal website or blog URL</li>
                <li>Profile verification status</li>
                <li>Reputation score based on community activity</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">3. Prompt Submissions and User Content</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                When you submit, create, or edit prompts, we collect and store:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>Prompt title, description, and full prompt text</li>
                <li>System prompts and user prompts</li>
                <li>Expected outputs and examples</li>
                <li>Variables, usage instructions, and test cases</li>
                <li>Categories, subcategories, tags, and AI platforms</li>
                <li>License type and commercial use permissions</li>
                <li>Submission timestamp and modification history</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">4. AI-Generated Metadata</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                OSPL uses Google Gemini API to automatically analyze your prompts and generate metadata including:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>Estimated token counts and character/word counts</li>
                <li>Complexity levels (Small, Medium, Large, Very Large)</li>
                <li>Difficulty ratings (Beginner, Intermediate, Advanced)</li>
                <li>Structure levels (Freeform, Balanced, Structured, Highly Structured)</li>
                <li>Quality scores (0-100) based on completeness</li>
                <li>Prompt traits (Role-based, Step-by-step, Production-ready, etc.)</li>
                <li>Compatible AI model recommendations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">5. Favorites, Bookmarks, and Ratings</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                We record:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>Prompts you bookmark or save</li>
                <li>Collections you create and manage</li>
                <li>Ratings (1-5 stars) and reviews you submit for prompts</li>
                <li>Timestamps of these interactions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">6. Usage Analytics</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                We collect analytics data about your interactions with OSPL including:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>Pages viewed and prompts clicked</li>
                <li>Search queries entered</li>
                <li>Filters and categories explored</li>
                <li>Time spent on specific prompts</li>
                <li>Devices and browsers used</li>
                <li>IP address and general location (country/city level)</li>
                <li>Referral source (how you arrived at OSPL)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">7. Cookies and Local Storage</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">
                We use cookies and browser local storage to:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2">
                <li>Maintain your session authentication</li>
                <li>Store your theme preference (light/dark mode)</li>
                <li>Cache locally saved/bookmarked prompt IDs</li>
                <li>Remember your filter preferences</li>
                <li>Track analytics events with session identifiers</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">How We Use Your Information</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            OSPL uses collected information for the following purposes:
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2">
            <li><strong>Service Provision:</strong> To create and maintain your account, authenticate your identity, and provide access to prompts, collections, and search features.</li>
            <li><strong>Content Discovery:</strong> To improve search algorithms, recommend relevant prompts based on your interests, and organize content into categories and tags.</li>
            <li><strong>Community Features:</strong> To enable ratings, reviews, collections, and allow you to share prompts with other users.</li>
            <li><strong>AI Analysis:</strong> To analyze prompt quality through Gemini API integration and generate metadata that helps other users discover and understand prompts better.</li>
            <li><strong>Analytics and Insights:</strong> To generate aggregate analytics showing trending prompts, popular categories, and weekly growth metrics.</li>
            <li><strong>Personalization:</strong> To customize your experience based on your preferences, theme choice, and historical interactions.</li>
            <li><strong>Communication:</strong> To send you updates about your account, notify you about new features, and respond to your inquiries.</li>
            <li><strong>Fraud Prevention and Security:</strong> To detect and prevent unauthorized access, spam, and malicious behavior.</li>
            <li><strong>Platform Improvement:</strong> To analyze usage patterns, identify performance bottlenecks, and develop new features.</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal obligations.</li>
          </ul>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Third-Party Services</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            OSPL integrates with the following third-party services, which may collect and process your data:
          </p>
          
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold mb-2">Supabase (Database & Authentication)</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Supabase provides our PostgreSQL database and authentication infrastructure. Your account data, prompts, ratings, and analytics are stored on Supabase infrastructure hosted on AWS. Supabase applies enterprise-grade security with encryption at rest and in transit. See Supabase's privacy policy at supabase.com/privacy.
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold mb-2">Google Gemini API</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                We use Google's Gemini API to analyze prompts and generate metadata estimates. The prompt text is sent to Google for analysis. Google processes this data according to their API terms. Gemini-generated metadata (token counts, complexity, quality scores) are estimates and may not be perfectly accurate.
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold mb-2">GitHub Authentication</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                We use GitHub OAuth for secure authentication. When you sign in, we receive your GitHub user ID and public profile information. GitHub processes your data according to their privacy policy.
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold mb-2">Vercel (Hosting & Deployment)</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                OSPL is deployed on Vercel's infrastructure. Vercel may collect analytics and infrastructure logs. See Vercel's privacy policy at vercel.com/privacy.
              </p>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Data Retention</h2>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2">
            <li><strong>Account Data:</strong> We retain your account information for as long as your account is active, plus 90 days after deletion for data recovery purposes.</li>
            <li><strong>Prompts:</strong> Prompts and user content remain in our database indefinitely unless you request deletion. Other users may have bookmarked or referenced your prompts.</li>
            <li><strong>Ratings and Reviews:</strong> User ratings, reviews, and interactions remain permanently associated with prompts to maintain community history.</li>
            <li><strong>Analytics:</strong> Aggregated analytics data is retained for trend analysis and reporting. Individual event logs are retained for 90 days.</li>
            <li><strong>Cookies:</strong> Session cookies expire when you close your browser. Preference cookies last up to 1 year.</li>
            <li><strong>Backup Data:</strong> We maintain encrypted backups of our database for disaster recovery, retained for up to 30 days.</li>
          </ul>
        </section>

        {/* Security */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Security Measures</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            We implement comprehensive security measures to protect your information:
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2">
            <li><strong>Authentication:</strong> GitHub OAuth provides secure, passwordless authentication. Session tokens are securely issued and validated server-side.</li>
            <li><strong>Encryption:</strong> Data is encrypted in transit using HTTPS/TLS. Sensitive data in the database is encrypted at rest.</li>
            <li><strong>Row Level Security:</strong> Supabase RLS policies ensure users can only access their own data, bookmarks, and ratings.</li>
            <li><strong>Access Controls:</strong> Our team has role-based access to production systems with audit logging.</li>
            <li><strong>Rate Limiting:</strong> We implement rate limiting to prevent abuse and DDoS attacks.</li>
            <li><strong>Regular Updates:</strong> We keep all dependencies and frameworks updated to patch security vulnerabilities.</li>
          </ul>
        </section>

        {/* User Rights */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Your Privacy Rights</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            Depending on your location, you may have certain rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2">
            <li><strong>Access:</strong> You can request a copy of all personal information we hold about you.</li>
            <li><strong>Correction:</strong> You can update or correct inaccurate information in your profile and account settings.</li>
            <li><strong>Deletion:</strong> You can request deletion of your account and associated data (subject to legal retention requirements).</li>
            <li><strong>Data Portability:</strong> You can request your data in a machine-readable format (JSON export).</li>
            <li><strong>Withdrawal of Consent:</strong> You can withdraw consent for specific data processing activities.</li>
            <li><strong>Opt-Out:</strong> You can disable analytics tracking through your account preferences.</li>
          </ul>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mt-4">
            To exercise these rights, contact us at privacy@ospl.dev with your request and account details.
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Children's Privacy</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            OSPL is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will promptly delete such information and terminate the child's account. If you believe we have collected information from a child under 13, please contact us immediately at privacy@ospl.dev.
          </p>
        </section>

        {/* International Users */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">International Data Transfers</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            OSPL operates globally. Your personal information may be transferred to, stored in, and processed in countries other than your country of residence, including the United States. These countries may have different data protection laws than your home country. By using OSPL, you consent to the transfer of your information to countries outside your country of residence, which may provide a different level of data protection.
          </p>
        </section>

        {/* Policy Changes */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Changes to This Privacy Policy</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by posting the new Privacy Policy on this page with an updated "Last Updated" date. Your continued use of OSPL following the posting of a revised Privacy Policy means you accept and agree to the changes. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Contact Us</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2 text-neutral-700 dark:text-neutral-300">
            <p><strong>Email:</strong> privacy@ospl.dev</p>
            <p><strong>Website:</strong> ospl.dev</p>
            <p className="text-sm mt-4">Response time: We will respond to privacy inquiries within 30 days.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
