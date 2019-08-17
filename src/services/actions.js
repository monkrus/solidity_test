import {CONFIG} from '../util/config'

export const getBalance = async (owner) => {
  const balance = await CONFIG.web3.eth.getBalance(owner)
  return balance.toString()
}



export const getVehicleMoves = async (operAddr) => {
  var prevCreations = [];
  var enterRoad;
  var vehicleAddr;
  var currOperator = await CONFIG.operator.at(operAddr)
  var RoadEnterance = currOperator.LogRoadEntered({}, {
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((resolve, reject) => {
    RoadEnterance.get(async (error, logsEnter) => {
      for (var i = 0; i < logsEnter.length; i++) {

        if (logsEnter[i].args.entryBooth !== '' && logsEnter[i].args.entryBooth !== undefined) {
          enterRoad = logsEnter[i].args.entryBooth;
          vehicleAddr = logsEnter[i].args.vehicle;

          var exitRoad = await exitReporting(currOperator, logsEnter[i].args.exitSecretHashed);
          var tempObject = {
            roadEnter: enterRoad,
            roadExit: exitRoad,
            vehicle: vehicleAddr,
          }
          prevCreations.push(tempObject);
        }

      }
      resolve(prevCreations)
    })
  })
}

export const exitReporting =  (currOper, hash) => {
  let exitRoad;
  const exitEvent = currOper.LogRoadExited({exitSecretHashed: hash},
    {
      fromBlock: 1,
      toBlock: 'latest'
    })

   return new Promise((resolve, reject) => {
    exitEvent.get((err, exitResult) => {
      for (var k = 0; k < exitResult.length; k++) {
        if (exitResult[k] !== '' && exitResult[k] !== undefined) {
          exitRoad = exitResult[k].args.exitBooth;
        }
      }
      resolve(exitRoad)
    })
  })
}

export const getExistingMultipliers = async (operAddr) => {
  var prevCreations = [];
  var currOperator = await CONFIG.operator.at(operAddr)
  var TollMultiplier = currOperator.LogMultiplierSet({}, {
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((resolve, reject) => {
    TollMultiplier.get((error, logs) => {
      for (var i = 0; i < logs.length; i++) {
        if (logs[i].args.multiplier !== '' && logs[i].args.multiplier !== undefined) {
          var tempObject = {
            type: logs[i].args.vehicleType.toNumber(),
            mult: logs[i].args.multiplier.toNumber(),
            sender: logs[i].args.sender,
          }
          prevCreations.push(tempObject);
        }
      }
      resolve(prevCreations)
    })
  })
}
export const getCreatedRoadsEvents = async (operAddr) => {
  var prevCreations = [];
  var currOperator = await CONFIG.operator.at(operAddr)
  var TollRoadPrice = currOperator.LogRoutePriceSet({}, {
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((resolve, reject) => {
    TollRoadPrice.get((error, logs) => {
      for (var i = 0; i < logs.length; i++) {
        if (logs[i].args.entryBooth !== '' && logs[i].args.entryBooth !== undefined) {
          var tempObject = {
            enter: logs[i].args.entryBooth,
            exit: logs[i].args.exitBooth,
            price: logs[i].args.priceWeis.toNumber(),
            sender: logs[i].args.sender
          }
          prevCreations.push(tempObject);
        }
      }
      resolve(prevCreations)
    })
  })
}

export const getCreatedToolsEvents = async (operAddr) => {
  var prevCreations = [];
  var currOperator = await CONFIG.operator.at(operAddr)
  var TollCreationEvent = currOperator.LogTollBoothAdded({}, {
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((resolve, reject) => {
    TollCreationEvent.get((error, logs) => {
      for (var i = 0; i < logs.length; i++) {
        if (logs[i].args.tollBooth !== '' && logs[i].args.tollBooth !== undefined) {
          var tempObject = {
            operator: logs[i].args.sender,
            toll: logs[i].args.tollBooth,
          }
          prevCreations.push(tempObject);
        }
      }
      resolve(prevCreations)
    })
  })
}

export const getCreatedVehiclesEvents = async () => {

  var prevCreations = [];
  var OperatorCreationEvent = await CONFIG.regulatorInstance.LogVehicleTypeSet({}, {
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((resolve, reject) => {
    OperatorCreationEvent.get((error, logs) => {

      for (var i = 0; i < logs.length; i++) {
        if (logs[i].args.vehicle !== '' && logs[i].args.vehicle !== undefined) {
          var tempObject = {
            address: logs[i].args.vehicle,
            type: logs[i].args.vehicleType.toNumber(),
          }
          prevCreations.push(tempObject);
        }
      }
      resolve(prevCreations)
    })
  })
}
export const getCreatedOperatorsEvents = async () => {
  var prevCreations = [];
  var OperatorCreationEvent = await CONFIG.regulatorInstance.LogTollBoothOperatorCreated({}, {
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((resolve, reject) => {
    OperatorCreationEvent.get((error, logs) => {
      for (var i = 0; i < logs.length; i++) {
        if (logs[i].args.newOperator !== '' && logs[i].args.newOperator !== undefined) {
          prevCreations.push(logs[i].args.newOperator)
        }
      }
      resolve(prevCreations)
    })
  })
}



export const getExitRoadInformation = async (operatorAddress, secret, callback) => {
  return await execConstant(async () => {
    const operatorInstance = await CONFIG.operator.at(operatorAddress)
    const hashed = await
      operatorInstance.hashSecret(secret)
    const event = operatorInstance.LogRoadExited({exitSecretHashed: hashed}, {fromBlock: 1})
    event.get((err, result) => {
      if (err) alert(err)
      else callback(result)
    })
  })
}

export const getPendingPayment = async (operatorAddress, secret, callback) => {
  return await execConstant(async () => {
    const operatorInstance = await CONFIG.operator.at(operatorAddress)
    const hashed = await
      operatorInstance.hashSecret(secret)
    const event = operatorInstance.LogPendingPayment({exitSecretHashed: hashed}, {fromBlock: 1})
    event.get((err, result) => {
      if (err) alert(err)
      else callback(result)
    })
  })
}


export const setVehicleType = async (_address, _type, _regulator, gas) => {


  return await execTransaction(() => CONFIG.regulatorInstance.setVehicleType(_address, _type, {from: _regulator, gas}))

}

export const createOperator = async (_owner, _deposit, _regulator, gas) => {
  let txInf = await execTransaction(() => CONFIG.regulatorInstance.createNewOperator(_owner, _deposit, {
    from: _regulator,
    gas
  }))
  if (txInf !== undefined) {
    return txInf[1].args.newOperator;
  }
}



export const isOperatorPaused = async (operatorAddress) => {
  return await execConstant(async () => {
    const operatorInstance = await CONFIG.operator.at(operatorAddress)
    return await operatorInstance.isPaused()
  })
}

export const setPaused = async (operatorAddress, from, gas) => {
  const operatorInstance = await CONFIG.operator.at(operatorAddress)

  await execTransaction(() => operatorInstance.setPaused(false, {from, gas}))
}



export const enterRoad = async (operatorAddress, entryBooth, secret, from, value, gas) => {

  const operatorInstance = await CONFIG.operator.at(operatorAddress)
  const hashedSecret = await operatorInstance.hashSecret(secret)



 return await execTransaction(() => operatorInstance.enterRoad(entryBooth, hashedSecret, {from, value, gas}))
}

export const exitRoad = async (operatorAddress, exitBooth, secret, gas) => {
  const operatorInstance = await CONFIG.operator.at(operatorAddress)
  await execTransaction(() => operatorInstance.reportExitRoad(secret, {from: exitBooth, gas: gas}))
}

export const addTollBooth = async (tollBoothAddress, operatorAddress, from, gas) => {

  const operatorInstance = await CONFIG.operator.at(operatorAddress)
  return await execTransaction(() => operatorInstance.addTollBooth(tollBoothAddress, {from, gas}))
}


export const setMultiplier = async (operatorAddress, vehicleType, multiplier, from, gas) => {
  const operatorInstance = await CONFIG.operator.at(operatorAddress)
  return await execTransaction(() => operatorInstance.setMultiplier(vehicleType, multiplier, {from, gas}))
}

export const getOperatorOwner = async (operatorAddress) => {
  return await execConstant(async () => {
    const instance = await CONFIG.operator.at(operatorAddress)
    return await instance.getOwner()
  })
}



export const setRoutePrice = async (operatorAddress, price, fromBooth, toBooth, from, gas) => {
  const operatorInstance = await CONFIG.operator.at(operatorAddress)
  return execTransaction(() => operatorInstance.setRoutePrice(fromBooth, toBooth, price, {from, gas}))
}





const execTransaction = async (executor) => {
  try {
    const txObject = await executor()
    if (txObject.logs.length === 0) {
      alert('Transaction failed: Please, check console')
    } else {
      return txObject.logs
    }
  } catch (e) {
    alert(e)
  }
}

const execConstant = async (executor) => {
  try {
    return await executor()
  } catch (e) {

    alert(e)
  }
}
