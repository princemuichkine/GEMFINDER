package envload

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Load reads repo-root .env then web/.env. Existing process env wins.
func Load() {
	_ = godotenv.Load(".env", "web/.env")
}

func Token() string {
	return strings.TrimSpace(os.Getenv("TOKEN"))
}

func DatabaseURL() string {
	return strings.TrimSpace(os.Getenv("DATABASE_URL"))
}

func SupabaseURL() string {
	for _, v := range []string{
		os.Getenv("SUPABASE_URL"),
		os.Getenv("NEXT_PUBLIC_SUPABASE_URL"),
	} {
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		if strings.HasPrefix(v, "postgres://") || strings.HasPrefix(v, "postgresql://") {
			continue
		}
		return strings.TrimRight(v, "/")
	}
	return ""
}

func SupabaseKey() string {
	for _, v := range []string{
		os.Getenv("SUPABASE_SECRET_KEY"),
		os.Getenv("SUPABASE_KEY"),
		os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		os.Getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
		os.Getenv("SUPABASE_ANON_KEY"),
	} {
		if s := strings.TrimSpace(v); s != "" {
			return s
		}
	}
	return ""
}
