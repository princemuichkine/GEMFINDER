"use client";

import {
    Card,
    HTMLTable,
    Tag,
    Intent,
    AnchorButton,
    Icon
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { RepoStats } from "@/lib/supabase/queries";

interface GemTableProps {
    repos: RepoStats[];
    loading?: boolean;
}

export default function GemTable({ repos, loading }: GemTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (repos.length === 0) {
        return (
            <Card className="m-8 text-center text-gray-500">
                <h3 className="text-xl font-bold">No Gems Found</h3>
                <p>Try adjusting your filters or run the collector.</p>
            </Card>
        );
    }

    return (
        <Card className="m-4 bg-white dark:bg-gray-800 p-0 overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
            <HTMLTable striped interactive className="w-full">
                <thead>
                    <tr className="text-gray-600 dark:text-gray-300">
                        <th>Repository</th>
                        <th>Primary Language</th>
                        <th>Stars</th>
                        <th>Forks</th>
                        <th className="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {repos.map((repo) => (
                        <tr key={repo.repo_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="align-middle">
                                <div className="flex flex-col py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base text-gray-800 dark:text-gray-100">
                                            {repo.owner}/{repo.name}
                                        </span>
                                        <Tag
                                            intent={repo.score > 5 ? Intent.SUCCESS : Intent.NONE}
                                            minimal
                                            round
                                            className="text-xs"
                                        >
                                            {repo.score.toFixed(1)}
                                        </Tag>
                                    </div>
                                    <span className="text-gray-500 text-sm truncate max-w-md mt-1">
                                        {repo.description}
                                    </span>
                                </div>
                            </td>
                            <td className="align-middle">
                                {repo.language && (
                                    <Tag minimal intent={Intent.PRIMARY} className="font-medium">
                                        {repo.language}
                                    </Tag>
                                )}
                            </td>
                            <td className="align-middle">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 font-semibold">
                                        <Icon icon={IconNames.STAR} size={12} className="text-yellow-500" />
                                        {repo.stars.toLocaleString()}
                                    </div>
                                    {repo.stars_growth > 0 && (
                                        <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                                            <Icon icon={IconNames.TRENDING_UP} size={10} />
                                            {repo.stars_growth.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="align-middle">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 font-semibold">
                                        <Icon icon={IconNames.GIT_BRANCH} size={12} className="text-gray-400" />
                                        {repo.forks.toLocaleString()}
                                    </div>
                                    {repo.forks_growth > 0 && (
                                        <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                                            <Icon icon={IconNames.TRENDING_UP} size={10} />
                                            {repo.forks_growth.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="align-middle text-right">
                                <AnchorButton
                                    href={`https://github.com/${repo.owner}/${repo.name}`}
                                    target="_blank"
                                    icon={IconNames.SHARE}
                                    minimal
                                    intent={Intent.PRIMARY}
                                    text="View"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </HTMLTable>
        </Card>
    );
}
