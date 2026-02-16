import { supabase } from "@/lib/supabase/client";
import GemList from "../components/design/GemList";
import { Repository } from "@/lib/types";
import GemNavbar from "../components/design/GemNavbar";

// Disable caching for real-time updates
export const revalidate = 0;

async function getGems(language?: string) {
  let query = supabase
    .from('repositories')
    .select('*')
    .order('score', { ascending: false })
    .limit(50);

  if (language && language !== 'All') {
    query = query.ilike('language', language);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching gems:", error);
    return [];
  }

  return data as Repository[];
}

export default async function Home({ searchParams }: { searchParams: { lang?: string } }) {
  const language = searchParams?.lang || 'All';
  const gems = await getGems(language);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <GemNavbar />

      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Top Gems
          </h1>
          <div className="text-sm text-gray-500">
            Found {gems.length} promising repositories
          </div>
        </div>

        <GemList repos={gems} />
      </div>
    </main>
  );
}
