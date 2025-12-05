import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, Database, Lock, Share2, Cookie, UserCheck, Globe, Mail, Bell, Trash2 } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const lastUpdated = 'December 5, 2025'
  const effectiveDate = 'December 5, 2025'

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      icon: Shield,
      content: `Welcome to ChainTrack. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.

ChainTrack operates a blockchain-powered supply chain transparency platform. This policy applies to information we collect through our website, mobile applications, and related services (collectively, "the Service").

By using our Service, you consent to the data practices described in this policy.`
    },
    {
      id: 'collection',
      title: '2. Information We Collect',
      icon: Database,
      content: `**Information You Provide:**
• **Account Information**: Name, email address, password, company name, role/account type
• **Profile Information**: Profile picture, business details, contact preferences
• **Product Data**: Product names, descriptions, batch numbers, manufacturing dates, origin information
• **Shipment Data**: Shipping addresses, recipient information, tracking details
• **Communication**: Messages sent through the platform, support requests

**Information Collected Automatically:**
• **Device Information**: IP address, browser type, operating system, device identifiers
• **Usage Data**: Pages visited, features used, time spent, click patterns
• **Location Data**: General geographic location based on IP address
• **Cookies**: Session cookies, preference cookies, analytics cookies

**Blockchain Data:**
• **Wallet Addresses**: When you connect a cryptocurrency wallet
• **Transaction Hashes**: Records of blockchain transactions you initiate
• **Smart Contract Interactions**: Data submitted to blockchain smart contracts

Note: Data submitted to the blockchain is public and immutable by nature.`
    },
    {
      id: 'use',
      title: '3. How We Use Your Information',
      icon: Eye,
      content: `We use collected information for the following purposes:

**Service Operations:**
• Create and manage your account
• Process product registrations and verifications
• Facilitate shipment tracking and delivery
• Manage the rewards program and point balances

**Communication:**
• Send service-related notifications and updates
• Respond to your inquiries and support requests
• Send promotional communications (with your consent)

**Improvement & Analytics:**
• Analyze usage patterns to improve the Service
• Develop new features and functionality
• Conduct research and analytics

**Security & Compliance:**
• Detect and prevent fraud, abuse, and security threats
• Enforce our Terms of Service
• Comply with legal obligations

We do NOT sell your personal information to third parties.`
    },
    {
      id: 'sharing',
      title: '4. Information Sharing',
      icon: Share2,
      content: `We may share your information in the following circumstances:

**With Your Consent:**
• When you explicitly authorize sharing with third parties
• When you make information public on the platform

**Service Providers:**
• Cloud hosting providers (data storage and processing)
• Analytics services (usage analysis)
• Email service providers (communication delivery)
• Payment processors (if applicable)

All service providers are bound by contractual obligations to protect your data.

**Supply Chain Partners:**
• Relevant shipment information shared with couriers and delivery partners
• Product information visible to supply chain participants
• Verification data shown to consumers (product details, not personal data)

**Legal Requirements:**
• When required by law, regulation, or legal process
• To protect rights, safety, or property of ChainTrack or others
• In connection with fraud prevention or security investigations

**Business Transfers:**
• In connection with a merger, acquisition, or sale of assets
• Your data may be transferred as part of such transaction`
    },
    {
      id: 'blockchain-privacy',
      title: '5. Blockchain & Public Data',
      icon: Globe,
      content: `**Important Notice About Blockchain Data:**

By using ChainTrack's blockchain features, you acknowledge that:

• **Public Nature**: Data recorded on the Ethereum blockchain is publicly visible to anyone
• **Immutability**: Blockchain data cannot be modified or deleted once recorded
• **Pseudonymity**: While wallet addresses don't directly reveal identity, transactions can potentially be linked to individuals through analysis

**What Goes On-Chain:**
• Product registration data (name, description, batch numbers)
• Supply chain transfer records
• Verification timestamps

**What Stays Off-Chain:**
• Your personal account information (name, email, password)
• Internal analytics and usage data
• Communication and support records

We recommend not including sensitive personal information in product descriptions or other blockchain-recorded data.`
    },
    {
      id: 'security',
      title: '6. Data Security',
      icon: Lock,
      content: `We implement robust security measures to protect your information:

**Technical Safeguards:**
• Encryption of data in transit (TLS/SSL) and at rest
• Secure password hashing (bcrypt)
• JWT token-based authentication with blacklisting
• Regular security audits and vulnerability assessments

**Access Controls:**
• Role-based access to sensitive data
• Multi-factor authentication options
• Regular access reviews and monitoring

**Infrastructure:**
• Secure cloud infrastructure with redundancy
• Regular backups and disaster recovery procedures
• DDoS protection and firewall systems

**Incident Response:**
• Security incident response procedures
• Breach notification within legally required timeframes

While we strive to protect your data, no method of transmission or storage is 100% secure. You use the Service at your own risk.`
    },
    {
      id: 'cookies',
      title: '7. Cookies & Tracking',
      icon: Cookie,
      content: `**Types of Cookies We Use:**

**Essential Cookies:**
• Authentication and session management
• Security features
• These are required for the Service to function

**Functional Cookies:**
• Remember your preferences and settings
• Improve your experience

**Analytics Cookies:**
• Understand how users interact with the Service
• Help us improve features and performance
• We use privacy-respecting analytics

**Managing Cookies:**
• You can control cookies through your browser settings
• Disabling essential cookies may prevent certain features from working
• We honor "Do Not Track" browser signals

**Local Storage:**
• We use browser local storage for preferences and temporary data
• This helps improve performance and user experience`
    },
    {
      id: 'rights',
      title: '8. Your Rights & Choices',
      icon: UserCheck,
      content: `Depending on your location, you may have the following rights:

**Access & Portability:**
• Request a copy of your personal data
• Receive your data in a portable format

**Correction:**
• Update or correct inaccurate information
• Most profile information can be edited directly in your account

**Deletion:**
• Request deletion of your account and personal data
• Note: Blockchain data cannot be deleted due to its immutable nature

**Restriction & Objection:**
• Restrict certain processing of your data
• Object to processing for marketing purposes

**Withdrawal of Consent:**
• Withdraw consent for optional data processing
• Unsubscribe from marketing communications

**To Exercise Your Rights:**
Contact us at privacy@chaintrack.io with your request. We will respond within 30 days.

**Account Deletion:**
You can request account deletion through Settings or by contacting support. We will delete your off-chain data within 30 days, subject to legal retention requirements.`
    },
    {
      id: 'retention',
      title: '9. Data Retention',
      icon: Trash2,
      content: `**Retention Periods:**

• **Account Data**: Retained while your account is active, deleted within 30 days of account closure
• **Product/Shipment Data**: Retained for the life of the account plus 3 years for audit purposes
• **Analytics Data**: Aggregated and anonymized after 24 months
• **Support Communications**: Retained for 2 years after resolution
• **Blockchain Data**: Permanent (cannot be deleted)

**Legal Requirements:**
• We may retain data longer if required by law (tax records, legal disputes, etc.)
• Anonymized data may be retained indefinitely for research purposes

**After Deletion:**
• Backup copies may take up to 90 days to fully purge
• Blockchain records remain permanent`
    },
    {
      id: 'children',
      title: '10. Children\'s Privacy',
      icon: UserCheck,
      content: `ChainTrack is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at privacy@chaintrack.io.

If we discover we have collected information from a child under 18, we will delete it promptly.`
    },
    {
      id: 'international',
      title: '11. International Transfers',
      icon: Globe,
      content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

**Safeguards:**
• We use standard contractual clauses for international transfers
• We ensure adequate protection for your data regardless of location
• Blockchain data is distributed globally by nature

By using the Service, you consent to the transfer of your information to other countries.`
    },
    {
      id: 'changes',
      title: '12. Changes to This Policy',
      icon: Bell,
      content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by:

• Posting the new policy on this page
• Updating the "Last Updated" date
• Sending an email notification for material changes

We encourage you to review this policy periodically. Your continued use of the Service after changes constitutes acceptance of the updated policy.`
    },
    {
      id: 'contact',
      title: '13. Contact Us',
      icon: Mail,
      content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

**Privacy Inquiries:**
Email: privacy@chaintrack.io

**General Support:**
Email: support@chaintrack.io

**Data Protection Officer:**
Email: dpo@chaintrack.io

**Response Time:**
We aim to respond to all privacy-related inquiries within 30 days.

For complaints, you may also have the right to lodge a complaint with your local data protection authority.`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-600 to-secondary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            to="/register" 
            className="inline-flex items-center text-secondary-100 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Registration
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield size={40} />
              <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-secondary-100 text-lg">
              Your privacy is important to us. Learn how we collect, use, and protect your data.
            </p>
            <div className="mt-2 text-secondary-200 text-sm space-x-4">
              <span>Effective: {effectiveDate}</span>
              <span>•</span>
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 mb-8 border border-primary-100 dark:border-primary-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Privacy at a Glance</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">We don't sell your personal data</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Your data is encrypted in transit and at rest</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">You can request deletion of your data</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Minimal data collection practices</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-amber-500">⚠</span>
              <span className="text-gray-600 dark:text-gray-300">Blockchain data is public and permanent</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">We honor Do Not Track signals</span>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-secondary-600 dark:text-secondary-400 hover:underline text-sm"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                  <section.icon className="text-secondary-600 dark:text-secondary-400" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {section.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-line">
                    {paragraph.split('**').map((part, j) => 
                      j % 2 === 1 ? <strong key={j} className="text-gray-900 dark:text-white">{part}</strong> : part
                    )}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>By using ChainTrack, you acknowledge that you have read and understood this Privacy Policy.</p>
          <div className="mt-4 space-x-4">
            <Link to="/terms" className="text-secondary-600 dark:text-secondary-400 hover:underline">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/register" className="text-secondary-600 dark:text-secondary-400 hover:underline">
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
