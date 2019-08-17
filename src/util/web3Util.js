import Web3 from 'web3'
import contract from 'truffle-contract'

const useLocalWeb3Provider = () => {
  const localProvider = process.env.REACT_APP_WEB3_PROVIDER_URL || 'http://localhost:8545'
  const provider = new Web3.providers.HttpProvider(localProvider)
  return new Web3(provider)
}

const resolveWeb3 = (resolve) => {
  let { web3 } = window
  const alreadyInjected = typeof web3 !== 'undefined' // i.e. Mist/Metamask

  if (alreadyInjected) {
    console.log('Injected web3 detected.')
    web3 = new Web3(web3.currentProvider)
  } else {
    console.log('No web3 instance injected, using Local web3.')
    web3 = useLocalWeb3Provider()
  }

  resolve(web3)
}

const getWeb3 = new Promise((resolve) => {
    if (process.env.REACT_APP_USE_INJECTED_WEB3 === 'YES') {
      console.log('will try to use injected web3 if possible')
      if (document.readyState === 'complete') {
        resolveWeb3(resolve)
      } else {
        window.addEventListener(`load`, () => {
          resolveWeb3(resolve)
        })
      }
    } else {
      console.log('will not use injected web3 even if it is there')
      resolve(useLocalWeb3Provider())
    }
  })

const createContract = (_contractJson, _web3) => {
    const createdContract = contract(_contractJson);
    createdContract.setProvider(_web3.currentProvider);
    return fixTruffleContractCompatibilityIssue(createdContract);
}


const fixTruffleContractCompatibilityIssue = (contract) => {
    if (typeof contract.currentProvider.sendAsync !== "function") {
        contract.currentProvider.sendAsync = function() {
            return contract.currentProvider.send.apply(
                contract.currentProvider, arguments
            );
        };
    }
    return contract;
}

const getAccounts = web3 =>
    new Promise((resolve, reject) => {
        web3.eth.getAccounts(
            (error, accounts) => (error ? reject(error) : resolve(accounts))
        )
    })
export default { getWeb3, createContract, getAccounts }
