import { SignUp } from '@clerk/nextjs'
import { Home } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <Link href="/" className="flex items-center justify-center gap-2 text-blue-600">
          <Home className="h-8 w-8" />
          <span className="text-2xl font-bold">Home Inventory</span>
        </Link>
      </div>

      {/* Sign Up Form */}
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Create Account</h1>
          <SignUp 
            appearance={{
              elements: {
                card: 'shadow-none border-0',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden'
              }
            }}
          />
        </div>
        
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}