import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
export default class Test extends Command {
  static description = "Runs unit tests for a contract directory.";

  static examples = [
    "$ terrain test counter",
    "$ terrain test counter --no-fail-fast",
  ];

  static flags = {
    "no-fail-fast": flags.boolean({ description: "Run all tests regardless of failure." })
  };

  static args = [{ name: "contract-name", required: true }];

  async run() { // TODO use fs.existsSync() to call terrain test from any project directory level
    const { args, flags } = this.parse(Test);

    process.chdir(`contracts/${args["contract-name"]}`);

    execSync(
      `cargo test ${flags["no-fail-fast"] ? "--no-fail-fast" : ""}`, { stdio: "inherit" }
    );
  }
}
