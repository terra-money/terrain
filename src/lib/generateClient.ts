// eslint-disable-next-line import/no-relative-packages
import { generate, readSchemas } from '../../packages/cosmwasm-typescript-gen';

export default async (name: string, schemaDir: string, out: string) => {
  const schemas = readSchemas({ schemaDir, argv: {} });
  await generate(name, schemas, out);
};
