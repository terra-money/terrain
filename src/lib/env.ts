import {
  LocalTerra,
  RawKey,
  Wallet,
} from '@terra-money/feather.js';
import * as R from 'ramda';
import {
  ContractConfig,
  ContractRef,
  InstantiateMessage,
  loadConfig,
  loadGlobalConfig,
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
import TerrainCLI from '../TerrainCLI';

export type DeployHelpers = {
  build: (contract: string) => Promise<void>;
  optimize: (
    contract: string,
  ) => Promise<void>;
  storeCode: (
    contract: string,
    signer: Wallet,
    options?: {
      noRebuild?: boolean,
    },
  ) => Promise<number>;
  instantiate: (
    contract: string,
    signer: Wallet,
    options?: {
      codeId?: number,
      instanceId?: string,
      admin?: string,
      init?: InstantiateMessage,
    },
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
  keysPath: string,
  refsPath: string,
  network: string,
  prefix: string,
  defaultWallet: string,
): Env => {
  const connections = loadConnections(prefix);
  const config = loadConfig();
  const globalConfig = loadGlobalConfig();
  const keys = loadKeys(keysPath);
  const refs = loadRefs(refsPath)[network];
  const connection = connections(network);
  const { chainID } = connection;

  if (!refs) {
    TerrainCLI.error(`No contracts refs found for network "${network}" and chainID "${chainID}"`);
    process.exit(1);
  }

  const lcd = new LCDClientExtra({ [chainID]: connection }, chainID, prefix, refs);

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
      optimize: (contract: string) => optimize({
        contract,
        useCargoWorkspace: globalConfig.useCargoWorkspace,
      }),
      storeCode: (contract: string, signer: Wallet, options) => storeCode({
        signer,
        contract,
        network,
        refsPath,
        lcd,
        conf: config(network, contract),
        noRebuild: typeof options?.noRebuild === 'undefined' ? false : options.noRebuild,
        useCargoWorkspace: globalConfig.useCargoWorkspace,
        prefix,
      }),
      instantiate: (
        contract: string,
        signer: Wallet,
        options,
      ) => instantiate({
        instanceId: options?.instanceId,
        codeId: options?.codeId,
        signer,
        contract,
        network,
        refsPath,
        lcd,
        prefix,
        admin: options?.admin,
        // Use the instantiation message passed instead of default.
        conf: options?.init
          ? { instantiation: { instantiateMsg: options.init } }
          : config(network, contract),
      }),
    },
  };
};
