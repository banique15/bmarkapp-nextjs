'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

export default function DemoPage() {
  useEffect(() => {
    // Import and register the Lit Badge component
    import('@/components/web-components/badge')
  }, [])

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Badge Component Comparison</h1>
      
      <div className="space-y-12">
        {/* React Badge Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">React Badge Component</h2>
          <p className="text-gray-600 mb-6">
            Traditional React component using class-variance-authority for styling
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Usage Examples</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">New</Badge>
                <Badge variant="secondary">Beta</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">React Code:</h4>
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
            </pre>
          </div>
        </section>

        {/* Lit Badge Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Lit Web Component Badge</h2>
          <p className="text-gray-600 mb-6">
            Framework-agnostic web component using Lit with native Shadow DOM styling
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <badge-component variant="default">Default</badge-component>
                <badge-component variant="secondary">Secondary</badge-component>
                <badge-component variant="destructive">Destructive</badge-component>
                <badge-component variant="outline">Outline</badge-component>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Usage Examples</h3>
              <div className="flex flex-wrap gap-3">
                <badge-component variant="default">New</badge-component>
                <badge-component variant="secondary">Beta</badge-component>
                <badge-component variant="destructive">Error</badge-component>
                <badge-component variant="outline">Draft</badge-component>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Web Component Code:</h4>
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`<badge-component variant="default">Default</badge-component>
<badge-component variant="secondary">Secondary</badge-component>
<badge-component variant="destructive">Destructive</badge-component>
<badge-component variant="outline">Outline</badge-component>`}
            </pre>
          </div>
        </section>

        {/* Comparison Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Feature</th>
                  <th className="border border-gray-300 p-3 text-left">React Badge</th>
                  <th className="border border-gray-300 p-3 text-left">Lit Badge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Framework Dependency</td>
                  <td className="border border-gray-300 p-3">React only</td>
                  <td className="border border-gray-300 p-3">Framework agnostic</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Bundle Size</td>
                  <td className="border border-gray-300 p-3">Depends on React (~40KB)</td>
                  <td className="border border-gray-300 p-3">Standalone (~5KB with Lit)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Styling Approach</td>
                  <td className="border border-gray-300 p-3">CSS classes + CVA</td>
                  <td className="border border-gray-300 p-3">Shadow DOM + CSS-in-JS</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Style Isolation</td>
                  <td className="border border-gray-300 p-3">Global CSS (can leak)</td>
                  <td className="border border-gray-300 p-3">Encapsulated (Shadow DOM)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Reusability</td>
                  <td className="border border-gray-300 p-3">React projects only</td>
                  <td className="border border-gray-300 p-3">Any framework or vanilla JS</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">TypeScript Support</td>
                  <td className="border border-gray-300 p-3">Native</td>
                  <td className="border border-gray-300 p-3">Full support with decorators</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-medium">Browser Support</td>
                  <td className="border border-gray-300 p-3">IE11+ (with polyfills)</td>
                  <td className="border border-gray-300 p-3">Modern browsers (ES2017+)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Interactive Demo */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-orange-600">Interactive Demo</h2>
          <p className="text-gray-600 mb-6">
            Both components work identically but with different underlying technologies
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">React Badge in Action</h3>
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="default">Status</Badge>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary">Version</Badge>
                  <span className="text-sm text-gray-600">v2.1.0</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Environment</Badge>
                  <span className="text-sm text-gray-600">Production</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Lit Badge in Action</h3>
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center space-x-2 mb-2">
                  <badge-component variant="default">Status</badge-component>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <badge-component variant="secondary">Version</badge-component>
                  <span className="text-sm text-gray-600">v2.1.0</span>
                </div>
                <div className="flex items-center space-x-2">
                  <badge-component variant="outline">Environment</badge-component>
                  <span className="text-sm text-gray-600">Production</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}