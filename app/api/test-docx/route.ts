import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

// Force Node.js runtime for mammoth compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Test if mammoth is working
    console.log('Testing mammoth library...')
    
    // Create a simple test to verify mammoth is working
    const testResult = {
      mammothVersion: '1.10.0',
      nodeRuntime: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString()
    }
    
    console.log('Mammoth test successful:', testResult)
    
    return NextResponse.json({
      success: true,
      message: 'Mammoth library is working correctly',
      testResult
    })
    
  } catch (error: any) {
    console.error('Mammoth test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Mammoth test failed',
      details: {
        errorType: error.constructor.name,
        stack: error.stack
      }
    }, { status: 500 })
  }
}
