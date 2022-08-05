import { Command } from '@oclif/command';
import { build } from '../../lib/deployment';
import * as flag from '../../lib/flag';

export default class Build extends Command {
  static description = 'Build wasm bytecode.';

  static flags = {
    'config-path': flag.configPath,
  };

  static args = [{ name: 'contract', required: true }];

  async run() {
    const { args } = this.parse(Build);

    await build({
      contract: args.contract,
    });
  }
}
