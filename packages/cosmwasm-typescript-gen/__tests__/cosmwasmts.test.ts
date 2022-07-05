import { readSchemas } from '../src/utils';
import generate from '../src/generate';
import fromPartial from '../src/from-partial';
import reactQuery from '../src/react-query';
import recoil from '../src/recoil';

const FIXTURE_DIR = __dirname + '/../../../__fixtures__';
const OUTPUT_DIR = __dirname + '/../../../__output__';

it('vectis/factory', async () => {
    const out = OUTPUT_DIR + '/vectis/factory';
    const schemaDir = FIXTURE_DIR + '/vectis/factory/';

    const schemas = readSchemas({ schemaDir, argv: {} });
    await generate('Factory', schemas, out);
    await fromPartial('Factory', schemas, out);
    await recoil('Factory', schemas, out);
    await reactQuery('Factory', schemas, out);
})

it('vectis/govec', async () => {
    const out = OUTPUT_DIR + '/vectis/govec';
    const schemaDir = FIXTURE_DIR + '/vectis/govec/';

    const schemas = readSchemas({ schemaDir, argv: {} });
    await generate('Govec', schemas, out);
    await fromPartial('Govec', schemas, out);
    await recoil('Govec', schemas, out);
    await reactQuery('Govec', schemas, out);
})

it('vectis/proxy', async () => {
    const out = OUTPUT_DIR + '/vectis/proxy';
    const schemaDir = FIXTURE_DIR + '/vectis/proxy/';

    const schemas = readSchemas({ schemaDir, argv: {} });
    await generate('Proxy', schemas, out);
    await fromPartial('Proxy', schemas, out);
    await recoil('Proxy', schemas, out);
    await reactQuery('Proxy', schemas, out);
})

it('cosmwasm', async () => {
    const out = OUTPUT_DIR + '/cosmwasm';
    const schemaDir = FIXTURE_DIR + '/cosmwasm/';
    const schemas = readSchemas({ schemaDir, argv: { packed: true } });
    await generate('CW4Group', schemas, out);
    await fromPartial('CW4Group', schemas, out);
    await recoil('CW4Group', schemas, out);
    await reactQuery('CW4Group', schemas, out);
})

it('minter', async () => {
    const out = OUTPUT_DIR + '/minter';
    const schemaDir = FIXTURE_DIR + '/minter/';
    const schemas = readSchemas({ schemaDir, argv: {} });
    await generate('Minter', schemas, out);
    await fromPartial('Minter', schemas, out);
    await recoil('Minter', schemas, out);
    await reactQuery('Minter', schemas, out);
})

it('sg721', async () => {
    const out = OUTPUT_DIR + '/sg721';
    const schemaDir = FIXTURE_DIR + '/sg721/';

    const schemas = readSchemas({ schemaDir, argv: {} });
    await generate('Sg721', schemas, out);
    await fromPartial('Sg721', schemas, out);
    await recoil('Sg721', schemas, out);
    await reactQuery('Sg721', schemas, out);
})

it('cw-named-groups', async () => {
    const out = OUTPUT_DIR + '/cw-named-groups';
    const schemaDir = FIXTURE_DIR + '/cw-named-groups/';

    const schemas = readSchemas({ schemaDir, argv: {} });
    await generate('CwNamedGroups', schemas, out);
    await fromPartial('CwNamedGroups', schemas, out);
    await recoil('CwNamedGroups', schemas, out);
    await reactQuery('CwNamedGroups', schemas, out);
})