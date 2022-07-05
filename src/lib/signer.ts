import { LCDClient, LocalTerra, Wallet, SignatureV2 } from '@terra-money/terra.js';
import { cli } from 'cli-ux';
import * as path from 'path';
import { loadKeys } from '../config';

// eslint-disable-next-line import/prefer-default-export
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
    return localterra.wallets[signerId];
  }

  const keys = await loadKeys(path.join(process.cwd(), keysPath));

  if (!keys[signerId]) {
    cli.error(`key for '${signerId}' does not exists.`);
  }

  const w =  new Wallet(lcd, keys[signerId]);

  // Patch LedgerKey to add createAndSignTx support.
  if (w.key.transport) {
    w.createAndSignTx = async (input) => {
      const { accAddress } = keys[signerId];
      const accountInfo = await lcd.auth.accountInfo(accAddress);
      let accountNumber;
      let sequence;

      if (accountInfo.base_vesting_account) {
        accountNumber = accountInfo.base_vesting_account.base_account.account_number;
        sequence = accountInfo.base_vesting_account.base_account.sequence;
      } else {
        accountNumber = accountInfo.account_number;
        sequence = accountInfo.sequence;
      }

      const signMode = SignatureV2.SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
      const unsignedTx = await lcd.tx.create([{ address: accAddress }], { feeDenoms: ['uluna'], ...input });
      // TODO: Pull chainID
      const options = { chainID: 'phoenix-1', accountNumber, sequence, signMode };
      return await keys[signerId].signTx(unsignedTx, options, true);
    };
  }

  return w;
};
