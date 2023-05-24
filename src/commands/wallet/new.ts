import { Command, flags } from '@oclif/command';
import dedent from 'dedent';
import { MnemonicKey } from '@terra-money/terra.js';
import * as fs from 'fs';
import TerrainCLI from '../../TerrainCLI';

export default class WalletNew extends Command {
  static description = 'Generate a new wallet to use for signing contract transactions.';

  static flags = {
    outfile: flags.string({
      description:
        'The absolute path of where the mnemonic key will be stored. If omitted, output is sent to stdout',
    }),
    index: flags.integer({
      description: 'Key index to use, default value is 0.',
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
