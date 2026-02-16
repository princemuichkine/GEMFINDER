"use server";

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function runCollector() {
  try {
    const projectRoot = path.resolve(process.cwd(), "..");

    console.log("Triggering collector...");
    const { stdout, stderr } = await execAsync(
      `cd ${projectRoot} && GITHUB_TOKEN=${process.env.GITHUB_TOKEN} SUPABASE_URL=${process.env.SUPABASE_URL} go run ./cmd/gemhunter fetch`,
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
