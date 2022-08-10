import { Command, flags } from '@oclif/command';
import { MnemonicKey } from '@terra-money/terra.js';
import * as fs from 'fs';

export default class WalletNew extends Command {
  static description = 'Generate a new wallet to use for signing contracts';

  static flags = {
    outfile: flags.string({
      description: 'absolute path to store the mnemonic key to. If omitted, output to stdout',
    }),
    index: flags.integer({
      description: 'key index to use, default value is 0',
      default: 0,
    }),
  };

  async run() {
    const { flags } = this.parse(WalletNew);
    this.log('Generating new terra-wallet');

    const mk = new MnemonicKey({
      index: flags.index,
    });
    if (flags.outfile) {
      if (fs.existsSync(flags.outfile)) {
        this.error(`outfile: '${flags.outfile}' already exists, abort`);
        this.exit(1);
      }

      this.log(`saving mnemonic to '${flags.outfile}'`);
      fs.writeFileSync(flags.outfile, mk.mnemonic);
      this.exit(0);
    }

    this.log('address:');
    this.log(mk.accAddress);
    this.log('mnemonic key:');
    this.log(mk.mnemonic);

    this.exit(0);
  }
}
