import { Suspense } from 'react'
import { IdeaGenerator } from '@/components/design/idea-generator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <Suspense fallback={<LoadingSpinner />}>
                <IdeaGenerator />
            </Suspense>
        </main>
    )
}
