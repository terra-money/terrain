import { Command } from '@oclif/command';
import { LCDClient } from '@terra-money/feather.js';
import { loadConnections } from '../config';
import * as flag from '../lib/flag';
import TerrainCLI from '../TerrainCLI';

export default class Query extends Command {
  static description = 'Query contracts on the interchain';

  static examples = [
    '$ terrain query terra1..fx9fs \'{"get_count": {}}\'',
    '$ terrain query test \'{"get_count": {}}\' --network testnet --prefix juno',
  ];

  static flags = {
    ...flag.tx,
    ...flag.terrainPaths,
  };

  static args = [{ name: 'contract-address', required: true },
    {
      name: 'query', required: true, description: 'Query to be performed in JSON format', type: 'string',
    }];

  async run() {
    const { args, flags } = this.parse(Query);

    const connections = loadConnections(flags['config-path'], flags.prefix);
    const connection = connections(flags.network);
    const lcd = new LCDClient({ [connection.chainID]: connection });

    try {
      const res = await lcd.wasm.contractQuery(args['contract-address'], JSON.parse(args.query));
      TerrainCLI.success(`Query Result:\n \n ${JSON.stringify(res)}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        TerrainCLI.error('There was an error with your query. Make sure you have single quotes around your query and double quotes around query keys.');
      // @ts-ignore
      } else if (error?.response?.data.message) {
        // @ts-ignore
        TerrainCLI.error(`There was an error with your query \n\n ${error.response.data.message}`);
      }
    }
  }
}
