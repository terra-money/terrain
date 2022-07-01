const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default;
const fetch = require("isomorphic-fetch");
const { MsgSend, MnemonicKey, Coins, LCDClient, SignatureV2, CreateTxOptions } = require("@terra-money/terra.js");
const { LedgerKey } = require('@terra-money/ledger-terra-js');
const { cli } = require('cli-ux');


async function example() {
  // Fetch gas prices and convert to `Coin` format.
  const gasPrices = await (
    await fetch("https://columbus-api.terra.dev/gas-prices", { redirect: 'follow' })
  ).json();
  const gasPricesCoins = new Coins(gasPrices);

  const lcd = new LCDClient({
    URL: "https://columbus-lcd.terra.dev/",
    chainID: "columbus-5",
    gasPrices: gasPricesCoins,
    gasAdjustment: "1.5",
    gas: 10000000,
    isClassic: true,
  });


  // initialize a connection to ledger Terra App
  const transport = await TransportNodeHid.open("");
  const key = await LedgerKey.create(transport, '0');
  const wallet = lcd.wallet(key);
  const { accAddress } = await wallet.key;
  const { account_number: accountNumber, sequence } = await lcd.auth.accountInfo(accAddress);

  const signMode = SignatureV2.SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
  const unsignedTx = await lcd.tx.create([{ address: accAddress }], { feeDenoms: ['uluna'], msgs: [new MsgSend(accAddress, accAddress, new Coins({ uluna: '1000000' }))] });
  const options = { chainID: 'columbus-5', accountNumber, sequence, signMode };
  return key.signTx(unsignedTx, options, true);
}

example().then(
  (result) => {
    console.log(result);
  },
  (e) => {
    cli.error(e);
  }
);