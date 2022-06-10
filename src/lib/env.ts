import { AccAddress, LocalTerra, RawKey, Wallet } from "@terra-money/terra.js";
import * as R from "ramda";
import {
  ContractConfig,
  ContractRef,
  InstantiateMessage,
  loadConfig,
  loadConnections,
  loadKeys,
  loadRefs,
} from "../config";
import { storeCode, instantiate, buildWasm, optimizeWasm } from "./deployment";
import { LCDClientExtra } from "./LCDClientExtra";

export type DeployHelpers = {
  buildWasm: (contract: string, workspace?: string) => Promise<void>;
  optimizeWasm: (
    contract: string,
    workspace?: string,
    arm64?: boolean
  ) => Promise<void>;
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

export const getEnv = (
  configPath: string,
  keysPath: string,
  refsPath: string,
  network: string
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
      buildWasm: (contract: string, workspace?: string) =>
        buildWasm({
          contract,
          workspace,
        }),
      optimizeWasm: (contract: string, workspace?: string, arm64?: boolean) =>
        optimizeWasm({
          contract,
          workspace,
          arm64,
        }),
      storeCode: (signer: Wallet, contract: string) =>
        storeCode({
          signer,
          contract,
          network,
          refsPath,
          lcd,
          conf: config(network, contract),
        }),
      instantiate: (
        signer: Wallet,
        contract: string,
        codeId: number,
        instanceId: string,
        admin?: AccAddress,
        init?: InstantiateMessage
      ) =>
        instantiate({
          instanceId,
          codeId,
          signer,
          contract,
          network,
          refsPath,
          lcd,
          admin,
          // Use the instantiation message passed instead of default.
          conf: init
            ? { instantiation: { instantiateMsg: init } }
            : config(network, contract),
        }),
    },
  };
};
