import { Command, flags } from '@oclif/command';
import { optimize } from '../lib/deployment';

export default class Optimize extends Command {
  static description = 'Optimize wasm bytecode.';

  static flags = {
    workspace: flags.string({
      default: undefined,
    }),
    arm64: flags.boolean({
      description:
        'use rust-optimizer-arm64 for optimization. Not recommended for production, but it will optimize quicker on arm64 hardware during development.',
      default: false,
    }),
  };

  static args = [{ name: 'contract', required: false }];

  async run() {
    const { args, flags } = this.parse(Optimize);

    await optimize({
      contract: args.contract,
      workspace: flags.workspace,
      arm64: flags.arm64,
    });
  }
}
