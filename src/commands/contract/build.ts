import { Command, flags } from '@oclif/command';
import { build, optimize } from '../../lib/deployment';
import * as flag from '../../lib/flag';
import { loadGlobalConfig } from '../../config';

export default class Build extends Command {
  static description = 'Build and optimize wasm bytecode.';

  static flags = {
    optimize: flags.boolean({
      description: 'optimize the wasm.',
      default: false,
    }),
    arm64: flag.arm64,
    'config-path': flag.configPath,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Build);

    const globalConfig = loadGlobalConfig(flags['config-path']);

    await build({
      contract: args.contract,
    });

    if (flags.optimize) {
      await optimize({
        contract: args.contract,
        arm64: flags.arm64,
        useCargoWorkspace: globalConfig.useCargoWorkspace,
      });
    }
  }
}
