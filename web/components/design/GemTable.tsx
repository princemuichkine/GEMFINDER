"use client";

import {
    Card,
    HTMLTable,
    Tag,
    Intent,
    AnchorButton,
    Icon,
    Classes,
    Spinner
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { RepoStats } from "@/lib/supabase/queries";

interface GemTableProps {
    repos: RepoStats[];
    loading?: boolean;
}

function getLanguageIntent(language: string): Intent {
    const lang = language.toLowerCase();

    // JavaScript/TypeScript
    if (lang === 'javascript' || lang === 'js') return Intent.WARNING; // Yellow
    if (lang === 'typescript' || lang === 'ts') return Intent.PRIMARY; // Blue

    // Python
    if (lang === 'python') return Intent.SUCCESS; // Green

    // Java
    if (lang === 'java') return Intent.DANGER; // Red/Orange

    // Go
    if (lang === 'go' || lang === 'golang') return Intent.PRIMARY; // Blue

    // Rust
    if (lang === 'rust') return Intent.DANGER; // Orange/Red

    // C/C++
    if (lang === 'c' || lang === 'c++' || lang === 'cpp') return Intent.PRIMARY; // Blue

    // Ruby
    if (lang === 'ruby') return Intent.DANGER; // Red

    // PHP
    if (lang === 'php') return Intent.PRIMARY; // Blue

    // Swift
    if (lang === 'swift') return Intent.WARNING; // Orange

    // Kotlin
    if (lang === 'kotlin') return Intent.PRIMARY; // Blue/Purple

    // Shell/Bash
    if (lang === 'shell' || lang === 'bash' || lang === 'sh') return Intent.NONE; // Gray

    // HTML/CSS
    if (lang === 'html' || lang === 'css') return Intent.WARNING; // Orange

    // Default
    return Intent.NONE;
}

function getScoreIntent(score: number): Intent {
    // Color code scores: Higher is better!
    if (score >= 60) return Intent.SUCCESS;  // Green - Excellent gems
    if (score >= 40) return Intent.PRIMARY;  // Blue/Teal - Great finds
    if (score >= 20) return Intent.WARNING;  // Orange - Decent
    return Intent.DANGER; // Red - Low score
}

export default function GemTable({ repos, loading }: GemTableProps) {
    if (loading) {
        return (
            <Card>
                <div className="flex justify-center p-12">
                    <Spinner size={50} />
                </div>
            </Card>
        );
    }

    if (repos.length === 0) {
        return (
            <Card>
                <div className="text-center p-12">
                    <h3 className={Classes.HEADING}>No Gems Found</h3>
                    <p className={Classes.TEXT_MUTED}>Try adjusting your filters or run the collector.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
                <HTMLTable
                    striped
                    interactive
                    style={{ width: '100%', margin: 0 }}
                    className="bp5-html-table-compact"
                >
                    <thead>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, verticalAlign: 'middle' }}>Repository</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, verticalAlign: 'middle' }}>Language</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, verticalAlign: 'middle' }}>Stars</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, verticalAlign: 'middle' }}>Forks</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right', verticalAlign: 'middle' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {repos.map((repo) => (
                            <tr key={repo.repo_id}>
                                <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'top' }}>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-baseline gap-5 flex-wrap">
                                            <span className={Classes.HEADING} style={{ fontSize: '1rem', fontWeight: 600, lineHeight: '1.5' }}>
                                                {repo.owner}/{repo.name}
                                            </span>
                                            <Tag
                                                intent={getScoreIntent(repo.score)}
                                                minimal
                                                style={{ minHeight: '24px', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', padding: '4px 6px', marginLeft: '0.75rem' }}
                                            >
                                                {repo.score.toFixed(1)}
                                            </Tag>
                                        </div>
                                        {repo.description && (
                                            <span className={Classes.TEXT_MUTED} style={{ fontSize: '0.875rem', lineHeight: '1.4', maxWidth: '36rem' }}>
                                                {repo.description}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                                    {repo.language && (
                                        <Tag minimal intent={getLanguageIntent(repo.language)} style={{ minHeight: '24px', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', padding: '4px 6px' }}>
                                            {repo.language}
                                        </Tag>
                                    )}
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                                    <div className="flex flex-row items-center">
                                        <Tag minimal intent={Intent.WARNING} style={{ minHeight: '24px', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', padding: '4px 4px', maxWidth: 'fit-content', marginRight: '0.5rem' }}>
                                            {repo.stars.toLocaleString()}
                                            <Icon icon={IconNames.STAR} size={10} style={{ marginLeft: '3px', flexShrink: 0, transform: 'translateY(-2.5px)' }} />
                                        </Tag>
                                        {repo.stars_growth > 0 && (
                                            <Tag minimal intent={Intent.SUCCESS} style={{ minHeight: '24px', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', padding: '4px 4px', maxWidth: 'fit-content' }}>
                                                +{repo.stars_growth.toLocaleString()}
                                                <Icon icon={IconNames.TRENDING_UP} size={10} style={{ marginLeft: '3px', flexShrink: 0, transform: 'translateY(-2.5px)' }} />
                                            </Tag>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', verticalAlign: 'middle' }}>
                                    <div className="flex flex-row items-center">
                                        <Tag minimal intent={Intent.NONE} style={{ minHeight: '24px', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', padding: '4px 4px', maxWidth: 'fit-content', marginRight: '0.5rem' }}>
                                            {repo.forks.toLocaleString()}
                                            <Icon icon={IconNames.GIT_BRANCH} size={8} style={{ marginLeft: '3px', flexShrink: 0, transform: 'translateY(-3px)' }} />
                                        </Tag>
                                        {repo.forks_growth > 0 && (
                                            <Tag minimal intent={Intent.SUCCESS} style={{ minHeight: '24px', display: 'inline-flex', alignItems: 'center', fontSize: '0.875rem', padding: '4px 4px', maxWidth: 'fit-content' }}>
                                                +{repo.forks_growth.toLocaleString()}
                                                <Icon icon={IconNames.TRENDING_UP} size={10} style={{ marginLeft: '3px', flexShrink: 0, transform: 'translateY(-2.5px)' }} />
                                            </Tag>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', verticalAlign: 'middle' }}>
                                    <AnchorButton
                                        href={`https://github.com/${repo.owner}/${repo.name}`}
                                        target="_blank"
                                        minimal
                                        intent={Intent.PRIMARY}
                                        text="View"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </HTMLTable>
            </div>
        </Card>
    );
}
