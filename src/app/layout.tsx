import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/design/theme-provider'
import { SupabaseProvider } from '@/components/design/supabase-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Blue Ocean Ideas Generator',
    description: 'AI-powered startup ideas generator with blue ocean strategy focus',
    keywords: ['startup ideas', 'innovation', 'blue ocean strategy', 'AI', 'business ideas'],
    authors: [{ name: 'Blue Ocean Ideas Generator' }],
    viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SupabaseProvider>
                        {children}
                        <Toaster />
                    </SupabaseProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
