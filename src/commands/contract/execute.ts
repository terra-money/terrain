import { Command } from '@oclif/command';
import { LCDClient, AccAddress, MsgExecuteContract } from '@terra-money/feather.js';
import { loadConnections } from '../../config';
import * as flag from '../../lib/flag';
import TerrainCLI from '../../TerrainCLI';
import { getSigner } from '../../lib/signer';

export default class Query extends Command {
  static description = 'Query contracts on the interchain';

  static examples = [
    '$ terrain query terra1..fx9fs \'{"increment": {}}\'',
    '$ terrain query juno1..af00x \'{"reset": {count: 0}}\' --network testnet --config-path ../config.terrain.json ',
  ];

  static flags = {
    ...flag.tx,
    ...flag.terrainPaths,
  };

  static args = [{
    name: 'contract', required: true, description: 'Contract address', type: 'string',
  },
  {
    name: 'msg', required: true, description: 'Msg to be executed in JSON format', type: 'string',
  }];

  async run() {
    const { args, flags } = this.parse(Query);
    const prefix = AccAddress.getPrefix(args.contract);

    const connections = loadConnections(flags['config-path'], prefix);
    const connection = connections(flags.network);
    const { chainID } = connection;
    const lcd = new LCDClient({ [chainID]: connection });

    const signer = await getSigner({
      network: flags.network,
      signerId: flags.signer,
      keysPath: flags['keys-path'],
      lcd,
      configPath: flags['config-path'],
      prefix: flags.prefix,
    });

    try {
      const accAddress = signer.key.accAddress(prefix);
      const msg = new MsgExecuteContract(accAddress, args.contract, JSON.parse(args.msg));

      const execMsg = await signer.createAndSignTx({ chainID, msgs: [msg] });
      const res = await lcd.tx.broadcast(execMsg, chainID);

      TerrainCLI.success(`Tx hash:\n \n ${res.txhash}`);
    } catch (err) {
      let errMsg = 'There was an error with your transaction.';
      if (err instanceof SyntaxError) errMsg += ' Make sure you have single quotes around your msg and double quotes around keys.';
      // @ts-ignore
      else if (err?.response?.data.message) errMsg += `\n\n ${err.response.data.message}`;
      else errMsg += `\n\n ${err}`;
      TerrainCLI.error(errMsg);
    }
  }
}
