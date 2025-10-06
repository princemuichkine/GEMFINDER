'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

type SupabaseContextType = {
    session: Session | null
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                console.error('Error getting session:', error)
            } else {
                setSession(session)
                setUser(session?.user ?? null)
            }

            setLoading(false)
        }

        getSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error)
        }
    }

    const value = {
        session,
        user,
        loading,
        signOut,
    }

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    )
}

export const useSupabase = () => {
    const context = useContext(SupabaseContext)
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider')
    }
    return context
}
