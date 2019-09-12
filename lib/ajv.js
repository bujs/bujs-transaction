'use strict'

const Ajv = require('ajv')
const account = require('bujs-account')

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true
})

require('ajv-errors')(ajv)

ajv.addKeyword('isAddress', {
  type: 'string',
  validate: function (schema, data) {
    return account.isAddress(data)
  },
  errors: false
})

ajv.addKeyword('isNotEmpty', {
  type: 'string',
  validate: function (schema, data) {
    return typeof data === 'string' && data.trim() !== ''
  },
  errors: false
})

module.exports = ajv
