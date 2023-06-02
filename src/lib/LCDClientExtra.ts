import {
  Coins,
  CreateTxOptions,
  LCDClient,
  LCDClientConfig,
  MsgExecuteContract,
  WaitTxBroadcastResult,
  Wallet,
  AccAddress,
} from '@terra-money/feather.js';
import { ContractRef } from '../config';

export type ContractRefs = { [contractName: string]: ContractRef };
export class LCDClientExtra extends LCDClient {
  refs: ContractRefs;

  prefix: string;

  chainID: string;

  constructor(
    config: Record<string, LCDClientConfig>,
    chainID: string,
    prefix: string,
    refs: ContractRefs,
  ) {
    super(config);
    this.refs = refs;
    this.config = config;
    this.chainID = chainID;
    this.prefix = prefix;
  }

  query(contract: string, msg: Object, instanceId = 'default') {
    console.log(this.refs[this.chainID]);
    return this.wasm.contractQuery(
      this.refs[this.chainID][contract].contractAddresses[instanceId],
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
        wallet.key.accAddress(this.prefix),
        // Enable supplying a contract address instead of the contract name.
        AccAddress.validate(contract) ? contract
          : this.refs[this.chainID][contract].contractAddresses[instanceId],
        msg,
        coins,
      ),
    ];
    const mergedOptions = options ? { ...options, msgs } : { msgs };
    const tx = await wallet.createAndSignTx({ ...mergedOptions, chainID: this.chainID });
    return this.tx.broadcast(tx, this.chainID);
  }
}
