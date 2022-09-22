import * as t from "@babel/types";
import { camel, pascal } from "case";
import {
  bindMethod,
  typedIdentifier,
  promiseTypeAnnotation,
  classDeclaration,
  classProperty,
  arrowFunctionExpression,
  getMessageProperties,
  convertToQueryMethod,
} from "./utils";

import { QueryMsg, ExecuteMsg } from "./types";

import {
  getPropertyType,
  getType,
  createTypedObjectParams,
} from "./utils/types";
import { identifier, propertySignature } from "./utils/babel";

export const createWasmQueryMethod = (jsonschema: any, responses: string[]) => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  let responseType = pascal(`${methodName}Response`);

  // Support naming query responses exactly like the method, or without a preceding "Get".
  if (!responses.includes(responseType)) {
    const modifiedMethodName = methodName.replace('get', '');
    responseType = pascal(`${modifiedMethodName}Response`);
  }

  const properties = jsonschema.properties[underscoreName].properties ?? {};

  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);

  const args = Object.keys(properties).map((prop) => {
    return t.objectProperty(
      t.identifier(prop),
      t.identifier(camel(prop)),
      false,
      true
    );
  });

  const actionArg = t.objectProperty(
    t.identifier(underscoreName),
    t.objectExpression(args)
  );

  return t.classProperty(
    t.identifier(convertToQueryMethod(methodName)),
    arrowFunctionExpression(
      obj ? [obj] : [],
      t.blockStatement([
        t.returnStatement(
          t.callExpression(
            t.memberExpression(
              t.memberExpression(
                t.memberExpression(t.thisExpression(), t.identifier("client")),
                t.identifier("wasm")
              ),
              t.identifier("contractQuery")
            ),
            [
              t.memberExpression(
                t.thisExpression(),
                t.identifier("contractAddress")
              ),
              t.objectExpression([actionArg]),
            ]
          )
        ),
      ]),
      t.tsTypeAnnotation(
        t.tsTypeReference(
          t.identifier("Promise"),
          t.tsTypeParameterInstantiation([
            t.tSTypeReference(t.identifier(responseType)),
          ])
        )
      ),
      true
    )
  );
};

export const createQueryClass = (
  className: string,
  implementsClassName: string,
  queryMsg: QueryMsg,
  responses: string[],
) => {
  const propertyNames = getMessageProperties(queryMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(convertToQueryMethod).map(bindMethod);

  const methods = getMessageProperties(queryMsg).map((schema) => {
    return createWasmQueryMethod(schema, responses);
  });

  return t.exportNamedDeclaration(
    classDeclaration(
      className,
      [
        // client
        classProperty(
          "client",
          t.tsTypeAnnotation(t.tsTypeReference(t.identifier("LCDClient")))
        ),

        // contractAddress
        classProperty(
          "contractAddress",
          t.tsTypeAnnotation(t.tsStringKeyword())
        ),

        // constructor
        t.classMethod(
          "constructor",
          t.identifier("constructor"),
          [
            typedIdentifier(
              "client",
              t.tsTypeAnnotation(t.tsTypeReference(t.identifier("LCDClient")))
            ),
            typedIdentifier(
              "contractAddress",
              t.tsTypeAnnotation(t.tsStringKeyword())
            ),
          ],
          t.blockStatement([
            // client/contract set
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(t.thisExpression(), t.identifier("client")),
                t.identifier("client")
              )
            ),
            t.expressionStatement(
              t.assignmentExpression(
                "=",
                t.memberExpression(
                  t.thisExpression(),
                  t.identifier("contractAddress")
                ),
                t.identifier("contractAddress")
              )
            ),

            ...bindings,
          ])
        ),

        ...methods,
      ],
      [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))]
    )
  );
};

export const createWasmExecMethod = (jsonschema: any) => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const properties = jsonschema.properties[underscoreName].properties ?? {};
  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);
  const args = Object.keys(properties).map((prop) => {
    return t.objectProperty(
      t.identifier(prop),
      t.identifier(camel(prop)),
      false,
      prop === camel(prop)
    );
  });

  const constantParams = [
    identifier(
      "funds",
      t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Coins"))),
      true
    ),
  ];

  return t.classProperty(
    t.identifier(methodName),
    arrowFunctionExpression(
      obj
        ? [
            // props
            obj,
            ...constantParams,
          ]
        : constantParams,
      t.blockStatement([
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("senderAddress"),
            // TODO: Convert to t.conditionalExpression
            t.identifier(
              "isConnectedWallet(this.wallet) ? this.wallet.walletAddress : this.wallet.key.accAddress"
            )
          ),
        ]),
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("execMsg"),
            t.newExpression(t.identifier("MsgExecuteContract"), [
              t.identifier("senderAddress"),
              t.memberExpression(
                t.thisExpression(),
                t.identifier("contractAddress")
              ),
              t.objectExpression([
                t.objectProperty(
                  t.identifier(underscoreName),
                  t.objectExpression([...args])
                ),
              ]),
              t.identifier("funds"),
            ])
          ),
        ]),

        t.ifStatement(
          t.callExpression(t.identifier("isConnectedWallet"), [
            t.memberExpression(t.thisExpression(), t.identifier("wallet")),
          ]),
          t.blockStatement([
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("tx"),
                t.awaitExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.memberExpression(
                        t.thisExpression(),
                        t.identifier("wallet")
                      ),
                      t.identifier("post")
                    ),
                    [
                      t.objectExpression([
                        t.objectProperty(
                          t.identifier("msgs"),
                          t.arrayExpression([t.identifier("execMsg")])
                        ),
                      ]),
                    ]
                  )
                )
              ),
            ]),
            t.returnStatement(
              t.callExpression(t.identifier("waitForInclusionInBlock"), [
                t.memberExpression(t.thisExpression(), t.identifier("client")),
                t.memberExpression(
                  t.memberExpression(
                    t.identifier("tx"),
                    t.identifier("result")
                  ),
                  t.identifier("txhash")
                ),
              ])
            ),
          ]),
          t.blockStatement([
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("execTx"),
                t.awaitExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.memberExpression(
                        t.thisExpression(),
                        t.identifier("wallet")
                      ),
                      t.identifier("createAndSignTx")
                    ),
                    [
                      t.objectExpression([
                        t.objectProperty(
                          t.identifier("msgs"),
                          t.arrayExpression([t.identifier("execMsg")])
                        ),
                      ]),
                    ]
                  )
                )
              ),
            ]),
            t.returnStatement(
              t.callExpression(
                t.memberExpression(
                  t.memberExpression(
                    t.memberExpression(
                      t.thisExpression(),
                      t.identifier("client")
                    ),
                    t.identifier("tx")
                  ),
                  t.identifier("broadcast")
                ),
                [t.identifier("execTx")]
              )
            ),
          ])
        ),
      ]),
      // return type
      t.tsTypeAnnotation(
        t.tsTypeReference(
          t.identifier("Promise"),
          t.tsTypeParameterInstantiation([
            t.tsUnionType([
              t.tsTypeReference(t.identifier("WaitTxBroadcastResult")),
              t.tsTypeReference(t.identifier("TxInfo")),
              t.tsTypeReference(t.identifier("undefined")),
            ]),
          ])
        )
      ),
      true
    )
  );
};

export const createExecuteClass = (
  className: string,
  implementsClassName: string,
  extendsClassName: string,
  execMsg: ExecuteMsg
) => {
  const propertyNames = getMessageProperties(execMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = getMessageProperties(execMsg).map((schema) => {
    return createWasmExecMethod(schema);
  });

  const blockStmt = [];

  if (extendsClassName) {
    blockStmt.push(
      // super()
      t.expressionStatement(
        t.callExpression(t.super(), [
          t.identifier("client"),
          t.identifier("contractAddress"),
        ])
      )
    );
  }

  [].push.apply(blockStmt, [
    // client/contract set
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(t.thisExpression(), t.identifier("client")),
        t.identifier("client")
      )
    ),
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(t.thisExpression(), t.identifier("wallet")),
        t.identifier("wallet")
      )
    ),
    t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.memberExpression(t.thisExpression(), t.identifier("contractAddress")),
        t.identifier("contractAddress")
      )
    ),
    ...bindings,
  ]);

  return t.exportNamedDeclaration(
    classDeclaration(
      className,
      [
        // client
        classProperty(
          "client",
          t.tsTypeAnnotation(t.tsTypeReference(t.identifier("LCDClient")))
        ),

        // wallet
        classProperty(
          "wallet",
          t.tsTypeAnnotation(
            t.tsUnionType([
              t.tsTypeReference(t.identifier("Wallet")),
              t.tsTypeReference(t.identifier("ConnectedWallet")),
            ])
          )
        ),

        // contractAddress
        classProperty(
          "contractAddress",
          t.tsTypeAnnotation(t.tsStringKeyword())
        ),

        // constructor
        t.classMethod(
          "constructor",
          t.identifier("constructor"),
          [
            typedIdentifier(
              "client",
              t.tsTypeAnnotation(t.tsTypeReference(t.identifier("LCDClient")))
            ),
            typedIdentifier(
              "wallet",
              t.tsTypeAnnotation(
                t.tsUnionType([
                  t.tsTypeReference(t.identifier("Wallet")),
                  t.tsTypeReference(t.identifier("ConnectedWallet")),
                ])
              )
            ),
            typedIdentifier(
              "contractAddress",
              t.tsTypeAnnotation(t.tsStringKeyword())
            ),
          ],
          t.blockStatement(blockStmt)
        ),
        ...methods,
      ],
      [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))],
      extendsClassName ? t.identifier(extendsClassName) : null
    )
  );
};

export const createExecuteInterface = (
  className: string,
  extendsClassName: string | null,
  execMsg: ExecuteMsg
) => {
  const methods = getMessageProperties(execMsg).map((jsonschema) => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    return createPropertyFunctionWithObjectParamsForExec(
      methodName,
      // TODO: Set correct return.
      "any",
      jsonschema.properties[underscoreName]
    );
  });

  const extendsAst = extendsClassName
    ? [t.tSExpressionWithTypeArguments(t.identifier(extendsClassName))]
    : [];

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      extendsAst,
      t.tSInterfaceBody([
        // contract address
        t.tSPropertySignature(
          t.identifier("contractAddress"),
          t.tsTypeAnnotation(t.tsStringKeyword())
        ),

        ...methods,
      ])
    )
  );
};

export const createPropertyFunctionWithObjectParams = (
  methodName: string,
  responseType: string,
  jsonschema: any
) => {
  const obj = createTypedObjectParams(jsonschema);

  const func = {
    type: "TSFunctionType",
    typeAnnotation: promiseTypeAnnotation(responseType),
    parameters: obj ? [obj] : [],
  };

  return t.tSPropertySignature(
    t.identifier(methodName),
    t.tsTypeAnnotation(func)
  );
};

export const createPropertyFunctionWithObjectParamsForExec = (
  methodName: string,
  responseType: string,
  jsonschema: any
) => {
  const obj = createTypedObjectParams(jsonschema);
  const fixedParams = [
    identifier(
      "funds",
      t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Coins"))),
      true
    ),
  ];
  const func = {
    type: "TSFunctionType",
    typeAnnotation: promiseTypeAnnotation(responseType),
    parameters: obj ? [obj, ...fixedParams] : fixedParams,
  };

  return t.tSPropertySignature(
    t.identifier(methodName),
    t.tsTypeAnnotation(func)
  );
};

export const createQueryInterface = (className: string, queryMsg: QueryMsg, responses: string[]) => {
  const methods = getMessageProperties(queryMsg).map((jsonschema) => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    const queryMethodName = convertToQueryMethod(underscoreName);
    let responseType = pascal(`${methodName}Response`);

    // Support naming query responses exactly like the method, or without a preceding "Get".
    if (!responses.includes(responseType)) {
      const modifiedMethodName = methodName.replace('get', '');
      responseType = pascal(`${modifiedMethodName}Response`);
    }

    return createPropertyFunctionWithObjectParams(
      queryMethodName,
      responseType,
      jsonschema.properties[underscoreName]
    );
  });

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      [],
      t.tSInterfaceBody([
        t.tSPropertySignature(
          t.identifier("contractAddress"),
          t.tsTypeAnnotation(t.tsStringKeyword())
        ),
        ...methods,
      ])
    )
  );
};

export const createTypeOrInterface = (Type: string, jsonschema: any) => {
  if (jsonschema.type !== "object") {
    if (!jsonschema.type) {
      return t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(
          t.identifier(Type),
          null,
          t.tsTypeReference(t.identifier(jsonschema.title))
        )
      );
    }

    return t.exportNamedDeclaration(
      t.tsTypeAliasDeclaration(
        t.identifier(Type),
        null,
        getType(jsonschema.type)
      )
    );
  }
  const props = Object.keys(jsonschema.properties ?? {}).map((prop) => {
    const { type, optional } = getPropertyType(jsonschema, prop);
    return propertySignature(camel(prop), t.tsTypeAnnotation(type), optional);
  });

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(Type),
      null,
      [],
      t.tsInterfaceBody([...props])
    )
  );
};

export const createTypeInterface = (jsonschema: any) => {
  const Type = jsonschema.title;
  return createTypeOrInterface(Type, jsonschema);
};
