import { Command, flags } from "@oclif/command";
import { execSync } from "child_process";
export default class Test extends Command {
  static description = "Runs unit tests for a contract directory.";

  static examples = [
    "$ terrain test counter",
    "$ terrain test counter --no-fail-fast",
  ];

  static flags = {
    "--no-fail-fast": flags.string({ description: "Run all tests regardless of failure." })
  };

  static args = [{ name: "name", required: true }];

  async run() {
    const { args, flags } = this.parse(Test);

    process.chdir(`contracts/${args.name}`);
    

    // include --no-fail-fast as optional flag 


    execSync(
      `cargo test ${flags["--no-fail-fast"]}`, { stdio: "inherit" }
    );
  }
}
