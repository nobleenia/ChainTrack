import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, AlertTriangle, Scale, Users, Globe, Mail } from 'lucide-react'

export default function TermsOfServicePage() {
  const lastUpdated = 'December 5, 2025'

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FileText,
      content: `By accessing or using ChainTrack ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

These Terms apply to all visitors, users, and others who access or use the Service, including manufacturers, distributors, retailers, and consumers.`
    },
    {
      id: 'description',
      title: '2. Description of Service',
      icon: Globe,
      content: `ChainTrack is a blockchain-powered supply chain transparency platform that enables:

• **Product Registration**: Manufacturers can register products on the Ethereum blockchain
• **Supply Chain Tracking**: Track product movements through the supply chain
• **Product Verification**: Consumers can verify product authenticity via QR codes
• **Shipment Management**: P2P delivery tracking with courier integration
• **Rewards Program**: Earn points for platform engagement

The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.`
    },
    {
      id: 'accounts',
      title: '3. User Accounts',
      icon: Users,
      content: `**Account Creation**: You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.

**Account Security**: You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use or security breach.

**Account Types**: Different account types (Manufacturer, Distributor, Retailer, Consumer) have different capabilities and responsibilities within the platform.

**Account Termination**: We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.`
    },
    {
      id: 'blockchain',
      title: '4. Blockchain & Data',
      icon: Shield,
      content: `**Immutability**: Data recorded on the blockchain is permanent and cannot be deleted or modified. By using the Service, you acknowledge and accept this characteristic of blockchain technology.

**Wallet Connection**: Connecting a cryptocurrency wallet is optional but required for certain features. You are solely responsible for your wallet security and any transactions.

**Gas Fees**: Blockchain transactions may require gas fees paid in cryptocurrency. These fees are not controlled by ChainTrack and are paid directly to the network.

**Data Accuracy**: You are responsible for the accuracy of data you submit to the blockchain. False or misleading information may result in account termination.`
    },
    {
      id: 'conduct',
      title: '5. Acceptable Use',
      icon: Scale,
      content: `You agree NOT to use the Service to:

• Register counterfeit, illegal, or prohibited products
• Provide false or misleading product information
• Impersonate other users or entities
• Interfere with or disrupt the Service or servers
• Attempt to gain unauthorized access to any part of the Service
• Use the Service for money laundering or fraudulent purposes
• Violate any applicable laws or regulations
• Harvest or collect user information without consent
• Upload malicious code or content

Violation of these terms may result in immediate account termination and potential legal action.`
    },
    {
      id: 'intellectual',
      title: '6. Intellectual Property',
      icon: FileText,
      content: `**Our Property**: The Service, including its original content, features, and functionality, is owned by ChainTrack and protected by international copyright, trademark, and other intellectual property laws.

**Your Content**: You retain ownership of content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content in connection with the Service.

**Trademarks**: ChainTrack, the ChainTrack logo, and other marks are trademarks of ChainTrack. You may not use these marks without our prior written consent.`
    },
    {
      id: 'rewards',
      title: '7. Rewards Program',
      icon: Users,
      content: `**Points**: Points earned through the rewards program have no cash value and cannot be transferred or sold. Points may be converted to CTK tokens according to the current conversion rate.

**CTK Tokens**: CTK tokens are utility tokens for use within the ChainTrack ecosystem. They are not securities and do not represent ownership in ChainTrack.

**Program Changes**: We reserve the right to modify, suspend, or terminate the rewards program at any time, including changing point values, conversion rates, or redemption options.

**Abuse Prevention**: Fraudulent activity to earn points (fake accounts, automated verification, etc.) will result in point forfeiture and account termination.`
    },
    {
      id: 'liability',
      title: '8. Limitation of Liability',
      icon: AlertTriangle,
      content: `**Disclaimer**: THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.

**Product Verification**: While we strive to provide accurate verification, we cannot guarantee the authenticity of any product. Verification results are informational only and should not be the sole basis for purchasing decisions.

**Limitation**: TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHAINTRACK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.

**Cap**: Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us, if any, in the 12 months prior to the claim.`
    },
    {
      id: 'indemnification',
      title: '9. Indemnification',
      icon: Shield,
      content: `You agree to indemnify, defend, and hold harmless ChainTrack, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:

• Your use of the Service
• Your violation of these Terms
• Your violation of any third-party rights
• Any content you submit to the Service
• Your violation of any applicable laws`
    },
    {
      id: 'changes',
      title: '10. Changes to Terms',
      icon: FileText,
      content: `We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or prominent notice on the Service.

Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms. If you do not agree to the new Terms, you must stop using the Service.`
    },
    {
      id: 'governing',
      title: '11. Governing Law',
      icon: Scale,
      content: `These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.

Any disputes arising from these Terms or the Service shall be resolved through binding arbitration, except where prohibited by law. You waive any right to participate in class action lawsuits against ChainTrack.`
    },
    {
      id: 'contact',
      title: '12. Contact Us',
      icon: Mail,
      content: `If you have questions about these Terms of Service, please contact us:

**Email**: legal@chaintrack.io
**Support**: support@chaintrack.io

We aim to respond to all inquiries within 48 business hours.`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            to="/register" 
            className="inline-flex items-center text-primary-100 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Registration
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Scale size={40} />
              <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-primary-100 text-lg">
              Please read these terms carefully before using ChainTrack.
            </p>
            <p className="text-primary-200 text-sm mt-2">
              Last Updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
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
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <section.icon className="text-primary-600 dark:text-primary-400" size={24} />
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
          <p>By using ChainTrack, you acknowledge that you have read and understood these Terms of Service.</p>
          <div className="mt-4 space-x-4">
            <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline">
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
