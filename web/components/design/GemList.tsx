"use client";

import {
  Card,
  HTMLTable,
  Tag,
  Intent,
  H3,
  AnchorButton,
  Icon,
} from "@blueprintjs/core";
import { Repository } from "@/lib/types/repository";
import { IconNames } from "@blueprintjs/icons";

interface GemListProps {
  repos: Repository[];
}

export default function GemList({ repos }: GemListProps) {
  if (repos.length === 0) {
    return (
      <Card className="m-8 text-center text-gray-500">
        <H3>No Gems Found Yet</H3>
        <p>Run the collector to populate data.</p>
      </Card>
    );
  }

  return (
    <Card className="m-4 bg-white dark:bg-gray-800 p-0 overflow-hidden">
      <HTMLTable striped interactive className="w-full">
        <thead>
          <tr>
            <th>Score</th>
            <th>Repository</th>
            <th>Language</th>
            <th>Stars</th>
            <th>Issues</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => (
            <tr key={repo.id}>
              <td>
                <Tag
                  intent={repo.score > 5 ? Intent.SUCCESS : Intent.PRIMARY}
                  round
                  className="font-bold"
                >
                  {repo.score.toFixed(1)}
                </Tag>
              </td>
              <td>
                <div className="flex flex-col">
                  <span className="font-semibold text-lg">
                    {repo.owner}/{repo.name}
                  </span>
                  <span className="text-gray-500 text-sm truncate max-w-md">
                    {repo.description}
                  </span>
                </div>
              </td>
              <td>{repo.language && <Tag minimal>{repo.language}</Tag>}</td>
              <td>
                <div className="flex items-center gap-1">
                  <Icon
                    icon={IconNames.STAR}
                    size={12}
                    className="text-yellow-500"
                  />
                  {repo.stars.toLocaleString()}
                </div>
              </td>
              <td>{repo.issues.toLocaleString()}</td>
              <td className="text-right">
                <AnchorButton
                  href={`https://github.com/${repo.owner}/${repo.name}`}
                  target="_blank"
                  icon={IconNames.SHARE}
                  minimal
                  intent={Intent.PRIMARY}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    </Card>
  );
}
