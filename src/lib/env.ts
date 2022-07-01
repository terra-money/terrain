import {
  AccAddress, LocalTerra, RawKey, Wallet,
} from '@terra-money/terra.js';
import * as R from 'ramda';
import { LedgerKey } from '@terra-money/ledger-terra-js';
import {
  ContractConfig,
  ContractRef,
  InstantiateMessage,
  loadConfig,
  loadConnections,
  loadKeys,
  loadRefs,
} from '../config';
import { storeCode, instantiate } from './deployment';
import { LCDClientExtra } from './LCDClientExtra';

export type DeployHelpers = {
  storeCode: (signer: Wallet, contract: string) => Promise<number>;
  instantiate: (
    signer: Wallet,
    contract: string,
    codeId: number,
    instanceId: string,
    admin?: string,
    conf?: ContractConfig
  ) => Promise<string>;
};

export type Env = {
  config: (contract: string) => ContractConfig;
  refs: { [contractName: string]: ContractRef };
  wallets: { [key: string]: Wallet };
  client: LCDClientExtra;
  deploy: DeployHelpers;
};

export const getEnv = async (
  configPath: string,
  keysPath: string,
  refsPath: string,
  network: string,
): Env => {
  const connections = loadConnections(configPath);
  const config = loadConfig(configPath);
  const refs = loadRefs(refsPath)[network];

  const lcd = new LCDClientExtra(connections(network), refs);
  const keys = await loadKeys(lcd, keysPath);

  const userDefinedWallets = R.map<
    { [k: string]: RawKey | LedgerKey },
    { [k: string]: Wallet }
  >((k) => new Wallet(lcd, k), keys);

  return {
    config: (contract) => config(network, contract),
    refs,
    wallets: {
      ...new LocalTerra().wallets,
      ...userDefinedWallets,
    },
    client: lcd,
    // Enable tasks to deploy code.
    deploy: {
      storeCode: (signer: Wallet, contract: string) => storeCode({
        signer,
        contract,
        network,
        refsPath,
        lcd,
        conf: config(network, contract),
        noRebuild: false,
      }),
      instantiate: (
        signer: Wallet,
        contract: string,
        codeId: number,
        instanceId: string,
        admin?: AccAddress,
        init?: InstantiateMessage,
      ) => instantiate({
        instanceId,
        codeId,
        signer,
        contract,
        network,
        refsPath,
        lcd,
        admin,
        // Use the instantiation message passed instead of default.
        conf: init ? { instantiation: { instantiateMsg: init } } : config(network, contract),
      }),
    },
  };
};
