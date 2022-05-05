import { BlockTxBroadcastResult } from "@terra-money/terra.js";
import { Env } from "@terra-money/terrain";

export class Lib {
  env: Env;

  constructor(env: Env){
    this.env = env;
  }

  getCount = (env = this.env) => {
    return env.client.query("counter", { get_count: {} })
  }

  increment = (env = this.env) : Promise<BlockTxBroadcastResult> => {
    return env.client.execute(env.wallets.validator, "counter", { increment: {} })
  }
  
  reset = (env = this.env, count: number ) : Promise<BlockTxBroadcastResult> => {
    return env.client.execute(env.wallets.validator, "counter", { reset: { count } })
  }
};

export default Lib;