/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Terms & Conditions Page - PromptHub
 */

import React from 'react';

export default function TermsAndConditionsView() {
  const lastUpdated = 'June 10, 2026';

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 dark:from-brand-accent/5 dark:to-transparent py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-4">Terms & Conditions</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Last Updated: <span className="font-semibold">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 space-y-12">
        {/* Acceptance of Terms */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">Acceptance of Terms</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            By accessing and using PromptHub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. PromptHub reserves the right to make changes to these Terms & Conditions at any time, at its sole discretion. We will notify users of any material changes by updating the "Last Updated" date at the top of this page. Continued use of PromptHub after such notifications constitutes your acceptance of the modified Terms & Conditions.
          </p>
        </section>

        {/* Description of Service */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Description of Service</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            PromptHub is a comprehensive prompt library and discovery platform featuring:
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2 mb-4">
            <li><strong>Prompt Library:</strong> Browse, search, and discover AI prompts across multiple categories including Development, Marketing, Writing, Business, and more.</li>
            <li><strong>Advanced Search:</strong> Find prompts by keywords, tags, AI platforms, complexity level, difficulty, and structure.</li>
            <li><strong>Collections:</strong> Create, organize, and share curated collections of prompts for specific use cases or workflows.</li>
            <li><strong>Community Ratings:</strong> View and submit 1-5 star ratings and written reviews for prompts.</li>
            <li><strong>Bookmarks:</strong> Save your favorite prompts for later access.</li>
            <li><strong>AI Analysis:</strong> Access automatically generated metadata including token counts, complexity ratings, quality scores, and compatible AI model recommendations.</li>
            <li><strong>Metadata Generation:</strong> Benefit from Gemini-powered analysis providing prompt structure insights and optimization suggestions.</li>
            <li><strong>Prompt Submission:</strong> Authenticated users can submit original prompts and contribute to the community.</li>
            <li><strong>Author Profiles:</strong> Build a reputation as a prompt creator through community ratings and verified status.</li>
          </ul>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            The specific features available may change at any time at PromptHub's sole discretion. We reserve the right to modify, discontinue, or add services at any time.
          </p>
        </section>

        {/* User Accounts */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">User Accounts and Registration</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Registration and Account Creation</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                You can create a PromptHub account through GitHub authentication. By creating an account, you agree to provide accurate, complete, and current information about yourself and maintain the security of your account credentials.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Account Responsibility</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                You are responsible for maintaining the confidentiality of your GitHub credentials and for all activities that occur under your account. You agree to notify PromptHub immediately of any unauthorized use of your account or any other breach of security. You may not transfer or assign your account to any other person or entity.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Account Security</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Maintain strong, unique passwords and do not share your GitHub credentials. PromptHub is not responsible for unauthorized access to your account resulting from your negligence in protecting your login credentials. If you believe your account has been compromised, contact us immediately at support@prompthub.dev.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Account Termination</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                We reserve the right to suspend or terminate your account and access to PromptHub if we determine, in our sole discretion, that you have violated these Terms & Conditions or engaged in conduct harmful to the service, other users, or our platform.
              </p>
            </div>
          </div>
        </section>

        {/* User Content */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">User-Generated Content</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Ownership and Rights</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                You retain all ownership rights to any prompts, descriptions, reviews, and content you submit to PromptHub ("Your Content"). By submitting Your Content to PromptHub, you grant us a non-exclusive, royalty-free, worldwide, perpetual license to use, reproduce, modify, distribute, and display Your Content within PromptHub and related services. You agree that other users may view, bookmark, rate, and reference your submitted content.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">License Granting</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                When you submit a prompt to PromptHub, you must specify the license under which you share it (e.g., MIT, Apache 2.0, Creative Commons). You represent and warrant that you own or have obtained appropriate rights to share Your Content under the specified license. You are responsible for ensuring that your submission does not infringe upon any third-party intellectual property rights.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Your Responsibility</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                You are solely responsible for Your Content. You acknowledge and agree that you will not submit content that:
              </p>
              <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-1 ml-2 mt-2">
                <li>Violates any law or regulation</li>
                <li>Infringes third-party intellectual property rights</li>
                <li>Contains malware, viruses, or malicious code</li>
                <li>Promotes harassment, discrimination, or violence</li>
                <li>Contains sexually explicit, obscene, or indecent material</li>
                <li>Impersonates or misleads about your identity or affiliation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Review and Moderation</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                We employ automated systems and human reviewers to moderate content. While we strive to maintain a safe community, we do not review all submissions in real-time. We reserve the right to remove, disable, or refuse any content that violates these Terms & Conditions or that we deem harmful. Moderation decisions are at our sole discretion and may not be appealed.
              </p>
            </div>
          </div>
        </section>

        {/* Acceptable Use Policy */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Acceptable Use Policy</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            You agree not to use PromptHub for any unlawful purpose or in any way that violates these Terms & Conditions. Specifically, you agree not to:
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2">
            <li>Submit spam, duplicate, or misleading prompts</li>
            <li>Upload prompts containing malware, malicious code, or security vulnerabilities</li>
            <li>Submit content that infringes copyright, trademark, or other intellectual property rights</li>
            <li>Engage in harassment, threats, or abusive behavior toward other users</li>
            <li>Attempt to gain unauthorized access to PromptHub systems or other users' accounts</li>
            <li>Use automated tools (bots, scrapers) to download or extract mass content</li>
            <li>Manipulate ratings, bookmarks, or analytics through artificial means</li>
            <li>Attempt to circumvent rate limiting or security measures</li>
            <li>Reverse engineer, decompile, or attempt to discover the source code of PromptHub</li>
            <li>Interfere with the proper functioning of PromptHub infrastructure</li>
            <li>Use PromptHub to collect or store personal information about other users</li>
            <li>Engage in any form of phishing, fraud, or deception</li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Intellectual Property Rights</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            PromptHub and its original content, features, and functionality are owned by PromptHub, its licensors, and other providers of such material and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2 mb-4">
            <li><strong>Platform IP:</strong> Our platform design, logo, name, layout, and underlying code are our exclusive intellectual property.</li>
            <li><strong>User Content IP:</strong> User-submitted prompts remain the property of their creators and are governed by the specified license.</li>
            <li><strong>License:</strong> We grant you a limited, non-exclusive license to use PromptHub for personal, non-commercial purposes. This license does not include the right to download, reproduce, or redistribute our platform or its content (except as explicitly permitted by the platform).</li>
          </ul>
        </section>

        {/* AI-Generated Content Disclaimer */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">AI-Generated Content Disclaimer</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            PromptHub uses Google Gemini API to automatically analyze and generate metadata for prompts. Please note the following important disclaimers:
          </p>
          <div className="space-y-3">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Estimates and Approximations</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                AI-generated token counts, complexity ratings, quality scores, and difficulty assessments are estimates based on pattern analysis and may not be perfectly accurate. Actual token usage may vary depending on the specific AI model and parameters used.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Model Compatibility</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Recommended compatible models are based on prompt characteristics but are not guaranteed. Prompts may work with models not listed, and listed models may not always produce satisfactory results.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Quality Scores</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Quality scores (0-100) are AI-generated estimates and do not constitute guarantees of prompt effectiveness. Actual prompt quality depends on your specific use case and model.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">No Liability</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                PromptHub is not liable for inaccuracies in AI-generated metadata or for any consequences of relying on such metadata.
              </p>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Disclaimer of Warranties and Limitation of Liability</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Disclaimer of Warranties</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                PromptHub is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the service, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, or compatibility with your systems. We do not warrant that PromptHub will be error-free, uninterrupted, or free from viruses or other harmful components.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">Limitation of Liability</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                To the maximum extent permitted by law, PromptHub and its owners, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, revenue, data, or goodwill, arising out of or in connection with your use of PromptHub, even if we have been advised of the possibility of such damages.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-50">User Content Accuracy</h3>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                While we strive to maintain a community of quality prompts, PromptHub does not verify the accuracy, legality, safety, or reliability of user-submitted content. You use all prompts and user content at your own risk.
              </p>
            </div>
          </div>
        </section>

        {/* Third-Party Links */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Third-Party Links and Content</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            PromptHub may contain links to third-party websites or services, including GitHub profiles and external resources referenced in prompts. We are not responsible for the content, accuracy, or practices of third-party sites. Your use of third-party sites is governed by their terms and conditions and privacy policies. We strongly encourage you to review third-party terms before using their services.
          </p>
        </section>

        {/* Availability and Modifications */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Availability and Service Modifications</h2>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2">
            <li><strong>Modifications:</strong> We reserve the right to modify, add, or discontinue features of PromptHub at any time without notice or liability.</li>
            <li><strong>Maintenance:</strong> We may temporarily disable or restrict access to PromptHub for maintenance, upgrades, or repairs.</li>
            <li><strong>Service Interruptions:</strong> PromptHub may be unavailable due to technical issues, infrastructure problems, or third-party service outages. We will make reasonable efforts to maintain service availability but cannot guarantee uninterrupted access.</li>
            <li><strong>No Guarantees:</strong> We do not guarantee any specific uptime percentage or service level agreements for PromptHub.</li>
          </ul>
        </section>

        {/* Account Termination */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Termination of Accounts</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            We may suspend or terminate your account and access to PromptHub immediately, without notice or liability, if:
          </p>
          <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 space-y-2 ml-2 mb-4">
            <li>You violate these Terms & Conditions</li>
            <li>You engage in illegal or harmful behavior</li>
            <li>You repeatedly submit spam or low-quality content</li>
            <li>You attempt unauthorized access to our systems</li>
            <li>Your account is inactive for 24 months</li>
          </ul>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Upon termination, your right to access PromptHub immediately ceases. Your previously submitted content may remain accessible to other users, and aggregate data may be retained for analytical purposes.
          </p>
        </section>

        {/* Indemnification */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Indemnification</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            You agree to indemnify and hold harmless PromptHub, its owners, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorney fees) arising out of or related to: (1) your violation of these Terms & Conditions; (2) your use of PromptHub; (3) your user-submitted content; or (4) your violation of applicable laws or third-party rights.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Governing Law and Dispute Resolution</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            These Terms & Conditions are governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising out of or relating to these Terms & Conditions or PromptHub shall be exclusively subject to the jurisdiction of the state and federal courts located in San Francisco, California, and you agree to submit to the personal and exclusive jurisdiction of such courts.
          </p>
        </section>

        {/* Severability */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Severability</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            If any provision of these Terms & Conditions is determined to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid, or if not possible, severed from these Terms & Conditions. The remaining provisions shall continue in full force and effect.
          </p>
        </section>

        {/* Entire Agreement */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Entire Agreement</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            These Terms & Conditions, together with our Privacy Policy and any other policies published on PromptHub, constitute the entire and exclusive agreement between you and PromptHub regarding the use of PromptHub. They supersede all prior agreements, understandings, and negotiations. There are no agreements or understandings between you and PromptHub except as set forth in these documents.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">Contact Us</h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
            If you have any questions about these Terms & Conditions or PromptHub, please contact us:
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2 text-neutral-700 dark:text-neutral-300">
            <p><strong>Email:</strong> support@prompthub.dev</p>
            <p><strong>Website:</strong> prompthub.dev</p>
            <p className="text-sm mt-4">Response time: We will respond to inquiries within 48 hours.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
