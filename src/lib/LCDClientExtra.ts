import {
  Coins,
  CreateTxOptions,
  LCDClient,
  LCDClientConfig,
  MsgExecuteContract,
  WaitTxBroadcastResult,
  Wallet,
} from '@terra-money/feather.js';
import { ContractRef } from '../config';

export type ContractRefs = { [contractName: string]: ContractRef };
export class LCDClientExtra extends LCDClient {
  refs: ContractRefs;

  constructor(config: Record<string, LCDClientConfig>, refs: ContractRefs) {
    super(config);
    this.refs = refs;
    this.config = config;
  }

  query(contract: string, msg: Object, instanceId = 'default') {
    return this.wasm.contractQuery(
      this.refs[contract].contractAddresses[instanceId],
      msg,
    );
  }

  async execute(
    contract: string,
    wallet: Wallet,
    msg: Object,
    coins?: Coins.Input,
    options?: CreateTxOptions,
    instanceId = 'default',
  ): Promise<WaitTxBroadcastResult> {
    const { chainID, prefix } = Object.values(this.config)[0];
    const msgs = [
      new MsgExecuteContract(
        wallet.key.accAddress(prefix),
        // Enable supplying a contract address instead of the contract name.
        contract.startsWith('terra1') ? contract : this.refs[contract].contractAddresses[instanceId],
        msg,
        coins,
      ),
    ];
    const mergedOptions = options ? { ...options, msgs } : { msgs };
    const tx = await wallet.createAndSignTx({ ...mergedOptions, chainID });
    return this.tx.broadcast(tx, chainID);
  }
}
