"use server";

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function runCollector() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..");
    // const scriptPath = path.join(projectRoot, "run-collector.sh");
    // We need to ensure the environment variables are correctly picked up or passed
    // But since run-collector.sh sources them or they are in the env, standard mechanism might suffice
    // if running locally.

    console.log("Triggering collector...");
    // Using nohup to let it run in background if we wanted, but for now we might want to wait
    // or just fire and forget. User wants to know if it runs.

    // Note: In a real production env this would likely queue a job.
    // For local dev with this setup:
    const { stdout, stderr } = await execAsync(
      `export GITHUB_TOKEN=${process.env.GITHUB_TOKEN} && cd ${projectRoot} && ./run-collector.sh`,
    );

    console.log("Collector output:", stdout);
    if (stderr) console.error("Collector stderr:", stderr);

    return { success: true, message: "Collector ran successfully." };
  } catch (error: unknown) {
    console.error("Failed to run collector:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}
