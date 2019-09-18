'use strict'

const account = require('bujs-account')
const signer = require('bujs-signer')
const long = require('long')

const protoChain = require('./protobuf/chain_pb')
const operations = require('./operations')
const ajv = require('./ajv')

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
        throw new Error('unknown operation')
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
      throw new Error('must add operation first')
    }

    const schema = {
      $schema: 'http://json-schema.org/schema#',
      type: 'object',
      properties: {
        sourceAddress: {
          type: 'string',
          isAddress: true,
          errorMessage: {
            isAddress: 'should be valid address'
          }
        },
        nonce: {
          type: 'string'
        },
        feeLimit: {
          type: 'string'
        },
        gasPrice: {
          type: 'string'
        },
        seq: {
          type: 'string'
        },
        metadata: {
          type: 'string',
          isNotEmpty: true,
          errorMessage: {
            isNotEmpty: 'should not be empty'
          }
        }
      },
      required: [ 'sourceAddress', 'nonce' ]
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
      sourceAddress,
      nonce,
      feeLimit,
      gasPrice,
      seq,
      metadata
    } = args
    const tx = new protoChain.Transaction()
    tx.setSourceAddress(sourceAddress)
    tx.setNonce(long.fromValue(nonce))
    tx.setFeeLimit(long.fromValue(feeLimit || '3000'))
    tx.setGasPrice(long.fromValue(gasPrice || '1000'))

    if (seq) {
      tx.setCeilLedgerSeq(long.fromValue(seq))
    }

    if (metadata) {
      tx.setMetadata(Uint8Array.from(Buffer.from(metadata, 'utf8')))
    }

    tx.addOperations(this.operations)

    const blob = Buffer.from(tx.serializeBinary()).toString('hex')
    this.blob = blob
  }

  /**
   * Sign transaction
   *
   * @param {Array} privateKeys
   */
  signTransaction (privateKeys) {
    if (!Array.isArray(privateKeys)) {
      throw new Error('privateKeys must be an array')
    }

    if (this.blob.length === 0) {
      throw new Error('blob is required')
    }

    const blob = this.blob
    const bufBlob = Buffer.from(blob, 'hex')
    const uint8arrayBlob = Uint8Array.from(bufBlob)
    const signatures = []
    privateKeys.forEach(privateKey => {
      if (!account.isPrivateKey(privateKey)) {
        throw new Error(`'${privateKey}' is not privateKey`)
      }
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
   * @returns {Object}
   * @public
   */
  getSignedTransactionInfo () {
    if (this.blob.length === 0) {
      throw new Error('blob is required')
    }

    if (this.signatures.length === 0) {
      throw new Error('signatures is required')
    }

    const blob = this.blob
    const signatures = this.signatures
    let postData = {
      items: [{
        transaction_blob: blob,
        signatures: signatures
      }]
    }
    return postData
  }
}

module.exports = Transaction
