import { Command, flags } from "@oclif/command";
import { build, optimize } from "../lib/deployment";

export default class Build extends Command {
  static description = "Build and optimize wasm bytecode.";

  static flags = {
    "no-optimize": flags.boolean({
      description: "do not optimize the wasm.",
      default: false,
    }),
    workspace: flags.string({
      default: undefined,
    }),
    arm64: flags.boolean({
      description:
        "use rust-optimizer-arm64 for optimization. Not recommended for production, but it will optimize quicker on arm64 hardware during development.",
      default: false,
    }),
  };

  static args = [{ name: "contract", required: false }];

  async run() {
    const { args, flags } = this.parse(Build);

    await build({
      contract: args.contract,
      workspace: flags.workspace,
    });

    if (flags["no-optimize"] === false) {
      await optimize({
        contract: args.contract,
        workspace: flags.workspace,
        arm64: flags.arm64,
      });
    }
  }
}
