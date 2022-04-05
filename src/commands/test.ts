import { Command } from "@oclif/command";
import { execSync } from "child_process";
export default class Test extends Command {
  static description = "Run unit tests for a contract.";

  static examples = [
    "$ terrain test counter",
  ];

  static args = [{ name: "name", required: true }];

  async run() {
    const { args, flags } = this.parse(Test);

    execSync(
      `cargo test contracts/${args.name}`
    );
  }
}
