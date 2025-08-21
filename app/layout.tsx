import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LLM Consensus Benchmark',
  description: 'Compare single-word responses from multiple LLMs and visualize their consensus',
  keywords: ['LLM', 'AI', 'benchmark', 'consensus', 'OpenRouter', 'machine learning'],
  authors: [{ name: 'LLM Benchmark Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'LLM Consensus Benchmark',
    description: 'Compare single-word responses from multiple LLMs and visualize their consensus',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Consensus Benchmark',
    description: 'Compare single-word responses from multiple LLMs and visualize their consensus',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      LLM Consensus Benchmark
                    </h1>
                  </div>
                  <nav className="hidden md:flex space-x-8">
                    <a
                      href="/"
                      className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Benchmark
                    </a>
                    <a
                      href="/history"
                      className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      History
                    </a>
                    <a
                      href="/settings"
                      className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Settings
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            <main>
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 mt-16">
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-500 text-sm">
                  <p>&copy; 2024 LLM Consensus Benchmark. Built with Next.js and Supabase.</p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}