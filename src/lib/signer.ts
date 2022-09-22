import { LCDClient, LocalTerra, Wallet } from '@terra-money/terra.js';
import { cli } from 'cli-ux';
import * as path from 'path';
import { loadKeys } from '../config';
import TerrainCLI from '../TerrainCLI';

export const getSigner = async ({
  network,
  signerId,
  keysPath,
  lcd,
}: {
  network: string;
  signerId: string;
  keysPath: string;
  lcd: LCDClient;
}): Promise<Wallet> => {
  const localterra = new LocalTerra();
  if (
    network === 'localterra'
    && Object.prototype.hasOwnProperty.call(localterra.wallets, signerId)
  ) {
    cli.log(`using pre-baked '${signerId}' wallet on localterra as signer`);

    // @ts-ignore
    const signer = localterra.wallets[signerId];

    // Attempt to make a request to LocalTerra.
    // Alert user if LocalTerra request fails.
    try {
      await signer.sequence();
      return new Promise(signer);
    } catch {
      TerrainCLI.error('LocalTerra is currently not running.');
      process.exit();
    }
  }

  const keys = loadKeys(path.join(process.cwd(), keysPath));

  if (!keys[signerId]) {
    cli.error(`key for '${signerId}' does not exist.`);
  }

  const signer = await Promise.resolve(new Wallet(lcd, keys[signerId]));

  return signer;
};
