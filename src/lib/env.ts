import {
  AccAddress, LocalTerra, RawKey, Wallet,
} from '@terra-money/terra.js';
import * as R from 'ramda';
import {
  ContractConfig,
  ContractRef,
  InstantiateMessage,
  loadConfig,
  loadConnections,
  loadKeys,
  loadRefs,
} from '../config';
import {
  storeCode,
  instantiate,
  build,
  optimize,
} from './deployment';
import { LCDClientExtra } from './LCDClientExtra';

export type DeployHelpers = {
  build: (contract: string) => Promise<void>;
  optimize: (
    contract: string,
    arm64?: boolean
  ) => Promise<void>;
  storeCode: (
    signer: Wallet,
    contract: string,
  ) => Promise<number>;
  instantiate: (
    signer: Wallet,
    contract: string,
    codeId: number,
    instanceId?: string,
    admin?: string,
    conf?: ContractConfig
  ) => Promise<string>;
};

export type Env = {
  config: (contract: string) => ContractConfig;
  refs: { [contractName: string]: ContractRef };
  wallets: { [key: string]: Wallet };
  defaultWallet: Wallet;
  client: LCDClientExtra;
  deploy: DeployHelpers;
};

export const getEnv = (
  configPath: string,
  keysPath: string,
  refsPath: string,
  network: string,
  defaultWallet: string,
): Env => {
  const connections = loadConnections(configPath);
  const config = loadConfig(configPath);

  const keys = loadKeys(keysPath);
  const refs = loadRefs(refsPath)[network];

  const lcd = new LCDClientExtra(connections(network), refs);

  const userDefinedWallets = R.map<
    { [k: string]: RawKey },
    { [k: string]: Wallet }
  >((k) => new Wallet(lcd, k), keys);

  const wallets: { [k: string]: Wallet } = {
    ...new LocalTerra().wallets,
    ...userDefinedWallets,
  };

  if (!(defaultWallet in wallets)) {
    throw new Error('default wallet not found');
  }

  return {
    config: (contract) => config(network, contract),
    refs,
    wallets,
    defaultWallet: wallets[defaultWallet],
    client: lcd,
    // Enable tasks to deploy code.
    deploy: {
      build: (contract: string) => build({
        contract,
      }),
      optimize: (contract: string, arm64?: boolean) => optimize({
        contract,
        arm64,
      }),
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
        instanceId?: string,
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
