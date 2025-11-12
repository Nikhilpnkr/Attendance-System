'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Database, Settings, ArrowRight, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl w-full">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Setup Required
            </CardTitle>
            <CardDescription className="text-lg">
              Complete the setup to start using the Attendance Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Supabase Configuration Required</h3>
              </div>
              <p className="text-blue-800">
                Your application needs Supabase environment variables to connect to the database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Step 1: Create Supabase Project
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
                    <li>Click "Start your project" or "Sign up"</li>
                    <li>Choose your organization and create a new project</li>
                    <li>Wait for the project to be created</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Step 2: Get API Credentials
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li>In your Supabase dashboard, go to <strong>Settings → API</strong></li>
                    <li>Copy your <strong>Project URL</strong> and <strong>anon public</strong> key</li>
                    <li>Keep these values secure and don't share them publicly</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Step 3: Configure Environment
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Create a <code className="bg-gray-900 text-white px-2 py-1 rounded">.env.local</code> file in your project root:</p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                      <div>NEXT_PUBLIC_SUPABASE_URL=your_project_url_here</div>
                      <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here</div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> Replace the placeholder values with your actual Supabase credentials
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 flex items-center mb-3">
                <ArrowRight className="h-4 w-4 mr-2" />
                Step 4: Setup Database
              </h4>
              <p className="text-green-800 mb-4">
                After configuring your environment variables, you need to set up the database schema.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-green-600" />
                  <a href="/SETUP.md" target="_blank" className="text-green-600 hover:underline font-medium">
                    Open Complete Setup Guide
                  </a>
                </div>
                <p className="text-sm text-green-700">
                  Follow the comprehensive setup instructions to create all necessary tables and configure policies.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                Need help? Check the <a href="/SETUP.md" className="text-blue-600 hover:underline">complete setup guide</a>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            After completing the setup, this page will automatically redirect to your attendance dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}