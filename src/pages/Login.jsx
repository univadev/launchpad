import { Link } from 'react-router-dom'
import { SignIn } from '@clerk/react'

const appearance = {
  elements: {
    rootBox: 'w-full',
    card: 'bg-gray-900 border border-gray-800 shadow-none',
    headerTitle: 'text-white',
    headerSubtitle: 'text-gray-400',
    socialButtonsBlockButton:
      'border border-gray-700 hover:bg-gray-800 text-white normal-case',
    socialButtonsBlockButtonText: 'text-white font-medium',
    dividerLine: 'bg-gray-800',
    dividerText: 'text-gray-500',
    formFieldLabel: 'text-gray-300',
    formFieldInput:
      'bg-gray-800 border border-gray-700 text-white focus:border-brand-500',
    formButtonPrimary:
      'bg-brand-600 hover:bg-brand-700 text-white normal-case',
    footerActionText: 'text-gray-500',
    footerActionLink: 'text-brand-400 hover:text-brand-300',
    identityPreviewText: 'text-gray-300',
    identityPreviewEditButton: 'text-brand-400',
  },
  variables: {
    colorBackground: '#111827',
    colorText: '#ffffff',
    colorInputBackground: '#1f2937',
    colorInputText: '#ffffff',
  },
}

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-white logo">
            <img src="/favicon.svg" alt="Univa Dev" className="w-8 h-8" />
            Univa Dev
          </Link>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/feed"
          signUpForceRedirectUrl="/onboarding"
          appearance={appearance}
        />
      </div>
    </div>
  )
}
