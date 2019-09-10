'use strict'

const account = require('bujs-account')
const signer = require('bujs-signer')
const long = require('long')

const protoChain = require('./protobuf/chain_pb')
const operations = require('./operations')

class Transaction {
  constructor () {
    this.operations = []
    this.blob = ''
    this.signatures = []
  }

  /**
   * Add operation
   *
   * @param {String} type
   * @param {Object} options
   */
  addOperation (type, options = {}) {
    switch (type) {
      case 'sendBu':
        this.operations.push(operations.sendBu(options))
        break
      default:
        throw new Error('Invalid operation type')
    }
  }

  /**
   * Build transaction
   *
   * @param {Object} args
   * @param {String} args.sourceAddress
   * @param {String} args.nonce
   * @param {String} [args.feeLimit]
   * @param {String} [args.gasPrice]
   * @param {String} [args.seq]
   * @param {String} [args.metadata]
   * @returns {string}
   */
  buildTransaction (args = {}) {
    if (this.operations.length === 0) {
      throw new Error('you must add operation first')
    }
    const {
      sourceAddress,
      feeLimit,
      gasPrice,
      nonce,
      seq,
      metadata
    } = args
    const tx = new protoChain.Transaction()
    tx.setSourceAddress(sourceAddress)
    tx.setFeeLimit(long.fromValue(feeLimit))
    tx.setGasPrice(long.fromValue(gasPrice))
    tx.setNonce(long.fromValue(nonce))
    tx.setCeilLedgerSeq(long.fromValue(seq))

    if (typeof metadata === 'string' && metadata.length > 0) {
      tx.setMetadata(Uint8Array.from(Buffer.from(metadata, 'utf8')))
    }

    tx.addOperations(this.operations)

    const blob = Buffer.from(tx.serializeBinary()).toString('hex')
    this.blob = blob
    return blob
  }

  /**
   * Sign transaction
   *
   * @param {Array} privateKeys
   */
  signTransaction (privateKeys) {
    const blob = this.blob
    const bufBlob = Buffer.from(blob, 'hex')
    const uint8arrayBlob = Uint8Array.from(bufBlob)
    const signatures = []
    privateKeys.forEach(privateKey => {
      signatures.push({
        signData: signer.sign(uint8arrayBlob, privateKey),
        publicKey: account.privateToPublic(privateKey)
      })
    })

    this.signatures = signatures
  }

  /**
   * Get signed transaction information
   *
   * @returns {string}
   * @public
   */
  getSignedTransactionInfo () {
    const blob = this.blob
    const signatures = this.signatures
    let postData = {
      items: [{
        transaction_blob: blob,
        signatures: signatures
      }]
    }
    return JSON.stringify(postData)
  }
}

module.exports = Transaction
