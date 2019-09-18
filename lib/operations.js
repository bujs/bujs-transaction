'use strict'

const protoChain = require('./protobuf/chain_pb')
const ajv = require('./ajv')

function sendBu (args = {}) {
  const schema = {
    $schema: 'http://json-schema.org/schema#',
    type: 'object',
    properties: {
      to: {
        type: 'string',
        isAddress: true,
        errorMessage: {
          isAddress: 'should be valid address'
        }
      },
      amount: {
        type: 'string',
        isNotEmpty: true,
        errorMessage: {
          isNotEmpty: 'should not be empty'
        }
      }
    },
    required: [ 'to', 'amount' ]
  }
  const validate = ajv.compile(schema)
  const valid = validate(args)

  if (!valid) {
    const property = validate.errors[0].dataPath ? `property '${validate.errors[0].dataPath.substr(1)}'` : false
    let message = `${validate.errors[0].message}`

    if (property) {
      message = `${message} ${property}`
    }

    throw new Error(message)
  }

  const {
    to, amount
  } = args

  const payCoin = new protoChain.OperationPayCoin()
  payCoin.setDestAddress(to)
  payCoin.setAmount(amount)

  let operation = new protoChain.Operation()
  operation.setType(protoChain.Operation.Type.PAY_COIN)
  operation.setPayCoin(payCoin)
  return operation
}

function activateAccount (args = {}) {
  const schema = {
    $schema: 'http://json-schema.org/schema#',
    type: 'object',
    properties: {
      to: {
        type: 'string',
        isAddress: true,
        errorMessage: {
          isAddress: 'should be valid address'
        }
      },
      amount: {
        type: 'string',
        isNotEmpty: true,
        errorMessage: {
          isNotEmpty: 'should not be empty'
        }
      }
    },
    required: [ 'to', 'amount' ]
  }
  const validate = ajv.compile(schema)
  const valid = validate(args)

  if (!valid) {
    const property = validate.errors[0].dataPath ? `property '${validate.errors[0].dataPath.substr(1)}'` : false
    let message = `${validate.errors[0].message}`

    if (property) {
      message = `${message} ${property}`
    }

    throw new Error(message)
  }

  const {
    to, initBalance
  } = args

  const defaultTxThreshold = 1
  const defaultMasterWeight = 1

  const threshold = new protoChain.AccountThreshold()
  threshold.setTxThreshold(defaultTxThreshold)

  const privilege = new protoChain.AccountPrivilege()
  privilege.setThresholds(threshold)
  privilege.setMasterWeight(defaultMasterWeight)

  const createAccount = new protoChain.OperationCreateAccount()
  createAccount.setDestAddress(to)
  createAccount.setInitBalance(parseInt(initBalance))
  createAccount.setPriv(privilege)

  const operation = new protoChain.Operation()
  operation.setType(protoChain.Operation.Type.CREATE_ACCOUNT)
  operation.setCreateAccount(createAccount)
  return operation
}

module.exports = {
  sendBu,
  activateAccount
}
