import { generate, readSchemas } from '@terra-money/terra-cosmwasm-typescript-gen';

export default async (name: string, schemaDir: string, out: string) => {
  const schemas = readSchemas({ schemaDir, argv: {} });
  await generate(name, schemas, out);
};
