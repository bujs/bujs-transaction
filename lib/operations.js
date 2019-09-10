'use strict'

const protoChain = require('./protobuf/chain_pb')

function sendBu (dest, amount) {
  const payCoin = new protoChain.OperationPayCoin()
  payCoin.setDestAddress(dest)
  payCoin.setAmount(amount)

  let operation = new protoChain.Operation()
  operation.setType(protoChain.Operation.Type.PAY_COIN)
  operation.setPayCoin(payCoin)
  return operation
}

module.exports = {
  sendBu
}
