import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { MnemonicKey } from '@terra-money/feather.js';
import * as fs from 'fs';
import TerrainCLI from '../../TerrainCLI';

export default class WalletNew extends Command {
  static description = 'Generate a new wallet to use for signing contracts';

  static flags = {
    outfile: flags.string({
      description:
        'absolute path to store the mnemonic key to. If omitted, output to stdout',
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
      }

      this.log(`saving mnemonic to '${flags.outfile}'`);
      fs.writeFileSync(flags.outfile, mk.mnemonic);
    }

    TerrainCLI.success(
      dedent`
      Your wallet has been successfully generated. You may find your mnemonic, or seed phrase, in the "${flags.outfile}" file.\n
      Wallet Address: "${mk.accAddress}"\n
      "WARNING:" Anyone who gains access to your seed phrase can access the contents of the corresponding wallet. Be cognizant of the fact that there is no recourse for theft of a seed phrase.`,
      'Wallet Successfully Generated',
    );
  }
}
