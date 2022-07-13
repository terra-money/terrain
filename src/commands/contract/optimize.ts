import { Command } from '@oclif/command';
import { optimize } from '../../lib/deployment';
import * as flag from '../../lib/flag';
import { loadGlobalConfig } from '../../config';

export default class Optimize extends Command {
  static description = 'Optimize wasm bytecode.';

  static flags = {
    arm64: flag.arm64,
    'config-path': flag.configPath,
  };

  static args = [{ name: 'contract', required: false }];

  async run() {
    const { args, flags } = this.parse(Optimize);

    const globalConfig = loadGlobalConfig(flags['config-path']);

    await optimize({
      contract: args.contract,
      arm64: flags.arm64,
      useCargoWorkspace: globalConfig.useCargoWorkspace,
    });
  }
}
