import { Command } from '@oclif/command';
import { LCDClient, AccAddress } from '@terra-money/feather.js';
import { loadConnections } from '../../config';
import * as flag from '../../lib/flag';
import TerrainCLI from '../../TerrainCLI';

export default class Query extends Command {
  static description = 'Query contracts on the interchain';

  static examples = [
    '$ terrain query terra1..fx9fs \'{"get_count": {}}\'',
    '$ terrain query juno1..af00x \'{"get_count": {}}\' --network testnet --config-path ../config.terrain.json ',
  ];

  static flags = {
    network: flag.network,
    'config-path': flag.configPath,
  };

  static args = [{
    name: 'contract', required: true, description: 'Contract address', type: 'string',
  },
  {
    name: 'msg', required: true, description: 'Query msg to be performed in JSON format', type: 'string',
  }];

  async run() {
    const { args, flags } = this.parse(Query);
    const prefix = AccAddress.getPrefix(args.contract);

    const connections = loadConnections(flags['config-path'], prefix);
    const connection = connections(flags.network);
    const lcd = new LCDClient({ [connection.chainID]: connection });

    try {
      const res = await lcd.wasm.contractQuery(args.contract, JSON.parse(args.msg));
      TerrainCLI.success(`Query Result:\n \n ${JSON.stringify(res)}`);
    } catch (err) {
      let errMsg = 'There was an error with your query.';
      if (err instanceof SyntaxError) errMsg += ' Make sure you have single quotes around your query and double quotes around query keys.';
      // @ts-ignore
      else if (err?.response?.data.message) errMsg += `\n\n ${err.response.data.message}`;
      else errMsg += `\n\n ${err}`;
      TerrainCLI.error(errMsg);
    }
  }
}
