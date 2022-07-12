import { Command, flags } from '@oclif/command';
import { build, optimize } from '../../lib/deployment';
import * as flag from '../../lib/flag';

export default class Build extends Command {
  static description = 'Build and optimize wasm bytecode.';

  static flags = {
    'no-optimize': flags.boolean({
      description: 'do not optimize the wasm.',
      default: false,
    }),
    workspace: flag.workspace,
    arm64: flag.arm64,
  };

  static args = [{ name: 'contract', required: false }];

  async run() {
    const { args, flags } = this.parse(Build);

    await build({
      contract: args.contract,
      workspace: flags.workspace,
    });

    if (!flags['no-optimize']) {
      await optimize({
        contract: args.contract,
        workspace: flags.workspace,
        arm64: flags.arm64,
      });
    }
  }
}
