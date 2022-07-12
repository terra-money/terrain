import { Command } from '@oclif/command';
import { optimize } from '../../lib/deployment';
import * as flag from '../../lib/flag';

export default class Optimize extends Command {
  static description = 'Optimize wasm bytecode.';

  static flags = {
    workspace: flag.workspace,
    arm64: flag.arm64,
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
