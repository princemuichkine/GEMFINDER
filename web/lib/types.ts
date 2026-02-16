export interface Repository {
    id: number;
    github_id: number;
    owner: string;
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    issues: number;
    score: number;
    created_at: string;
    updated_at: string;
    last_scanned_at: string;
}
