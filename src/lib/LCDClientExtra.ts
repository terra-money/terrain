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

  network: string;

  constructor(config: Record<string, LCDClientConfig>, network: string, refs: ContractRefs) {
    super(config);
    this.refs = refs;
    this.network = network;
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
    const msgs = [
      new MsgExecuteContract(
        wallet.key.accAddress(this.network),
        // Enable supplying a contract address instead of the contract name.
        contract.startsWith('terra1') ? contract : this.refs[contract].contractAddresses[instanceId],
        msg,
        coins,
      ),
    ];
    const mergedOptions = options ? { ...options, msgs } : { msgs };
    const tx = await wallet.createAndSignTx({ ...mergedOptions, chainID: this.network });
    return this.tx.broadcast(tx, this.network);
  }
}
