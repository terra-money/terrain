// eslint-disable-next-line import/no-relative-packages
import { generate, readSchemas } from '@octalmage/terra-cosmwasm-typescript-gen';

export default async (name: string, schemaDir: string, out: string) => {
  const contractInfo = await readSchemas({ schemaDir, argv: {} });
  try {
    await generate(name, contractInfo, out);
  } catch (e) {
    console.error(e);
  }
};
