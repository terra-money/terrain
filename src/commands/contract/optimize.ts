import { Command } from '@oclif/command';
import { optimize } from '../../lib/deployment';
import { configPath } from '../../lib/flag';
import { loadGlobalConfig } from '../../config';

export default class Optimize extends Command {
  static description = 'Optimize wasm bytecode.';

  static flags = {
    'config-path': configPath,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args, flags } = this.parse(Optimize);

    const globalConfig = loadGlobalConfig(flags['config-path']);

    await optimize({
      contract: args.contract,
      useCargoWorkspace: globalConfig.useCargoWorkspace,
    });
  }
}
