import Regulator from '../build/Regulator.json'
import Operator from '../build/TollBoothOperator.json'
import web3Util from './web3Util'

export var CONFIG = {}

export const _initConfigs = async (_web3) => {
  const accounts = await web3Util.getAccounts(_web3)
  const regulator = web3Util.createContract(Regulator, _web3)
  const operator = web3Util.createContract(Operator, _web3)
  const regulatorInstance = await regulator.deployed()

  CONFIG = {
    web3: _web3,
    accounts,
    regulator,
    operator,
    regulatorInstance,
    DEFAULT_GAS_LIMIT: 3000000
  }
}
