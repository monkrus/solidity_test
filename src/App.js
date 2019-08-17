import React, {Component} from 'react'
import './App.css'
import "bootstrap/dist/css/bootstrap.css";
import Regulator from "./components/Regulator"
import Operator from "./components/TollBoothOperator"
import Vehicle from "./components/Vehicle"
import Toll from "./components/IndividualToll"
import { CONFIG} from './util/config'
import {Navbar, NavItem, Nav, Grid, Row, Col, Alert, Button} from "react-bootstrap";
import * as Actions from './services/actions'

const TABS = [
  {name: "Regulator"},
  {name: "Toll operator"},
  {name: "Vehicles"},
  {name: "Toll booths"}
];

class App extends Component {
  constructor() {
    super();
    this.checkIsOperPresent = this.checkIsOperPresent.bind(this);
    this.state = {
      showAlert: false,
      alertField: '',
      currPage: 0,
      ownerOperator: 0,
      ownerRegulator: 0,
      defaultGas: 3000000,
      lastOperatorAddr: '',
      lastVehicleAddr: '',
      operators: [],
      vehicles: [],
      vehicleTypes: [],
      tolls: [],
      currVehicle: '',
      currVehType: '',
      isPaused: false,
      currOper: '',
      currInfo: '',
      operator: {
        currEnterToll: '',
        currExitToll: '',
        tollAddr: '',
        routePrice: 0,
        multiplier: 0,
      },

      regulator: {
        operatorAddr: '',
        depositOperator: 0,
        vehicleAddr: '',
        vehicleType: 0,
      },

      vehicle: {
        deposit: 0,
        pass: '',
        balance: 0
      },
      createdVehicles: [],
      createdTools: [],
      existedPrices: [],
      existedMultipl: [],
      vehiclesHistory: []
    };
  }

  componentWillMount() {
  }

  async componentDidMount() {
    await this.getOldOperators();
    await this.getOldVehicles();
    await this.getOldTools();
    await this.getOldRoadPrices();
    await this.getOldMultipliers();
    await this.getVehicleMoves();
    await this.refreshBalance();
    await this.checkPause();
  }

  async unpauseOper() {
    if (this.checkIsOperPresent()) {
      await Actions.setPaused(this.state.currOper, this.state.ownerOperator, this.state.defaultGas);
      await this.checkPause();
    }
  }


  async checkPause() {
    if (!this.state.currOper && this.state.operators[0] ) {

      const operatorOwner = await Actions.getOperatorOwner(this.state.operators[0])
      this.setState({
        currOper: this.state.operators[0],
        ownerOperator: operatorOwner
      })
    }
    if (this.state.currOper ) {

      var paused = await Actions.isOperatorPaused(this.state.currOper)
      this.setState(prevState => ({
            ...prevState,
            isPaused: paused
          }
        )
      )
    }

  }

  async createNewOperator() {
    if (this.state.regulator.operatorAddr ) {
      if (this.state.regulator.depositOperator ) {
        let newOperAddr = await Actions.createOperator(this.state.regulator.operatorAddr,
          this.state.regulator.depositOperator,
          CONFIG.accounts[0],
          this.state.defaultGas)
        if (newOperAddr) {
          this.setState({
            lastOperatorAddr: newOperAddr,
            operators: [...this.state.operators, newOperAddr]
          })
        }
        await this.checkPause();
      } else {
        this.showAlert("Deposit should be setted")
      }
    } else {
      this.showAlert("Empty new operator OWNER address")
    }
  }

  async getOldVehicles() {
    var prevVeh = await  Actions.getCreatedVehiclesEvents();
    this.setState(prevState => ({
      ...prevState,
      createdVehicles: prevVeh,
    }));
  }

  async getVehicleMoves() {
    for (var i = 0; i < this.state.operators.length; i++) {

      var logWay = await  Actions.getVehicleMoves(this.state.operators[i]);
      for (var k = 0; k < logWay.length; k++) {
        if (logWay[k].vehicle !== '' && logWay[k].vehicle !== undefined) {
          this.setState(prevState => ({
            ...prevState,
            vehiclesHistory: [...this.state.vehiclesHistory, {
              vehicle: logWay[k].vehicle,
              enter: logWay[k].roadEnter,
              exit: logWay[k].roadExit
            }]
          }));
        }
      }
    }
  }

  async getOldOperators() {
    var prevOperators = await  Actions.getCreatedOperatorsEvents();
    this.setState(prevState => ({
      ...prevState,
      operators: prevOperators,
    }));
  }

  async getOldTools() {
    for (var i = 0; i < this.state.operators.length; i++) {
      var prevTools = await  Actions.getCreatedToolsEvents(this.state.operators[i]);
      for (var k = 0; k < prevTools.length; k++) {
        this.setState(prevState => ({
          ...prevState,
          createdTools: [...this.state.createdTools, prevTools[k]],
        }));

      }
    }
  }

  async getOldRoadPrices() {
    for (var i = 0; i < this.state.operators.length; i++) {
      var prevTools = await  Actions.getCreatedRoadsEvents(this.state.operators[i]);
      for (var k = 0; k < prevTools.length; k++) {
        this.setState(prevState => ({
          ...prevState,
          existedPrices: [...this.state.existedPrices, prevTools[k]],
        }));

      }
    }
  }

  async getOldMultipliers() {
    for (var i = 0; i < this.state.operators.length; i++) {
      var prevTools = await  Actions.getExistingMultipliers(this.state.operators[i]);
      for (var k = 0; k < prevTools.length; k++) {
        this.setState(prevState => ({
          ...prevState,
          existedMultipl: [...this.state.existedMultipl, prevTools[k]],
        }));

      }
    }
  }

  async setVehicleType() {
    if (this.state.regulator.vehicleAddr ) {
      if (this.state.regulator.vehicleType ) {
        var temp = await Actions.setVehicleType(this.state.regulator.vehicleAddr,
          this.state.regulator.vehicleType,
          CONFIG.accounts[0],
          this.state.defaultGas)
        if (temp) {
          this.setState(prevState => ({
            ...prevState,
            lastVehicleAddr: this.state.regulator.vehicleAddr,
            vehicles: [...this.state.vehicles, this.state.regulator.vehicleAddr],
            vehicleTypes: [...this.state.vehicleTypes, this.state.regulator.vehicleType],
            createdVehicles: [...this.state.createdVehicles, {
              address: temp[0].args.vehicle,
              type: temp[0].args.vehicleType.toNumber()
            }]
          }));
        }
      } else {
        this.showAlert("Missing vehicle type")
      }
    } else {
      this.showAlert("Missing vehicle address")
    }
  }


  async refreshBalance() {
    if (!this.state.currVehicle  && this.state.createdVehicles[0] ) {

      await
        this.setState(prevState => ({
          ...prevState,
          currVehicle: this.state.createdVehicles[0].address,
        }));
    }
    let balance = 0
    try {
      balance = await
        Actions.getBalance(this.state.currVehicle)
    } catch (e) {
      balance = 0
    }
    this.setState(prevState => ({

        ...prevState,
        vehicle: {
          ...prevState.vehicle,
          balance: balance
        }
      })
    )
  }

  hideAlert() {
    this.setState(prevState => ({...prevState, showAlert: false}));
  }

  showAlert(fieldName) {
    this.setState(prevState => ({...prevState, showAlert: true, alertField: fieldName}));
  }

  renderAlert() {
    if (this.state.showAlert) {
      return (
        <Alert bsStyle="danger" onDismiss={this.handleDismiss}>
          <h4>Key fields are not filled!</h4>
          <p>
            {this.state.alertField}
          </p>
          <p>
            <Button bsStyle="danger" onClick={this.hideAlert.bind(this)}>Hide Alert</Button>
          </p>
        </Alert>
      )
    }
  }

  changeOperatorDeposit(e) {
    this.setState({
      regulator: {
        operatorAddr: this.state.regulator.operatorAddr,
        depositOperator: e.target.value
      }
    });
  }

  changeOperatorAddress(e) {
    this.setState({
      regulator: {
        depositOperator: this.state.regulator.depositOperator,
        operatorAddr: e.target.value
      }
    });
  }

  changeVehicleType(e) {
    this.setState({
      regulator: {
        vehicleAddr: this.state.regulator.vehicleAddr,
        vehicleType: e.target.value
      }
    });
  }

  changeRoadPrice(e) {
    const val = e.target.value;

    this.setState(prevState => ({

        ...prevState,
        operator: {
          ...prevState.operator,
          routePrice: val
        }
      })
    )
  }

  changeVehicleAddress(e) {
    this.setState({
      regulator: {
        vehicleType: this.state.regulator.vehicleType,
        vehicleAddr: e.target.value
      }
    });
  }

  async selectOper(e) {
    if (e.target.value !== '') {

      let tempOperAddr = e.target.value;
      const operatorOwner = await
        Actions.getOperatorOwner(e.target.value)
      await
        this.setState(prevState => ({
            ...prevState,
            currOper: tempOperAddr,
            ownerOperator: operatorOwner
          }
        ))
      await
        this.checkPause();
    }
  }

  async selectEnterToll(e) {
    const val = e.target.value;

    this.setState(prevState => ({
        ...prevState,
        operator: {
          ...prevState.operator,
          currEnterToll: val
        }
      })
    )
  }

  selectExitToll(e) {
    const val = e.target.value;

    this.setState(prevState => ({
        ...prevState,
        operator: {
          ...prevState.operator,
          currExitToll: val
        }
      })
    )
  }

  changeTollAddr(e) {

    const val = e.target.value;
    this.setState(prevState => ({
      ...prevState,
      operator: {
        ...prevState.operator,
        tollAddr: val
      }
    }));
  }


  async checkIsOperPresent() {
    if (!this.state.currOper  && this.state.operators[0]) {

      const operatorOwner = await
        Actions.getOperatorOwner(this.state.operators[0])
      this.setState({
        currOper: this.state.operators[0],
        ownerOperator: operatorOwner
      })
      return true;

    } else if (this.state.currOper ) {
      return true;
    } else {

      this.showAlert("Select operator")
      return false;
    }
  }

  async exitRoad() {
    if (await this.checkIsOperPresent()
    ) {
      if (!this.state.operator.currExitToll  && this.state.tolls[0]) {
        await
          this.setState(prevState => ({
            ...prevState,
            operator: {
              ...prevState.operator,
              currExitToll: this.state.tolls[0]
            }
          }));


      }else if (!this.state.operator.currExitToll){
        this.showAlert("Select exit toll")
        return ;
      }
      if (!this.state.vehicle.pass ){
        this.showAlert("Select pass")
        return ;
      }
      await
        Actions.exitRoad(this.state.currOper, this.state.operator.currExitToll,
          this.state.vehicle.pass, this.state.defaultGas)
    }
    else
      return;
  }

  async enterRoad() {

    if (await this.checkIsOperPresent()
    ) {
      if (!this.state.operator.currEnterToll  && this.state.createdTools[0]) {
        await
          this.setState(prevState => ({
            ...prevState,
            operator: {
              ...prevState.operator,
              currEnterToll: this.state.createdTools[0].toll
            }
          }));
      } else if (!this.state.operator.currEnterToll){
        this.showAlert("Missed enter Toll");
        return;
      }
      if (!this.state.currVehicle  && this.state.createdVehicles[0] ) {
        await
          this.setState(prevState => ({
            ...prevState,
            currVehicle: this.state.createdVehicles[0]
          }));
        this.refreshBalance();
      } else if (!this.state.currVehicle){
        this.showAlert("Missed vehicle");
        return;
      }
      if (!this.state.vehicle.pass) {
        this.showAlert("Missed password");
        return;
      }
      if (!this.state.vehicle.deposit) {
        this.showAlert("Missed deposit");
        return;
      }
      var enterLogs = await
        Actions.enterRoad(this.state.currOper, this.state.operator.currEnterToll,
          this.state.vehicle.pass, this.state.currVehicle, this.state.vehicle.deposit, this.state.defaultGas)
      if (enterLogs) {
        this.setState(prevState => ({
          ...prevState,
          vehiclesHistory: [...this.state.vehiclesHistory, {
            enter: enterLogs[0].args.entryBooth,
            exit: undefined,
            vehicle: enterLogs[0].args.vehicle
          }]
        }));
      } else {
        return
      }
    }
  }

  async loadInfo() {
    var infoText;
    for (let i = 0; i < this.state.operators.length; i++) {
      await
        Actions.getExitRoadInformation(this.state.operators[i], this.state.vehicle.pass, async (exitInfo) => {
          if (exitInfo.length > 0) {
            infoText = `Vehicle exited: ${exitInfo[0].args.exitBooth} with refund ${exitInfo[0].args.refundWeis}`
            this.setState(prevState => ({
              ...prevState,
              currInfo: infoText,
            }));
          } else {
            await Actions.getPendingPayment(this.state.operators[i], this.state.vehicle.pass, async (pendingInfo) => {
              if (pendingInfo.length > 0) {
                infoText = `Pending payment: Entry boot: ${pendingInfo[0].args.entryBooth} and Exit booth: ${pendingInfo[0].args.exitBooth}`
                this.setState(prevState => ({
                  ...prevState,
                  currInfo: infoText,
                }));
              } else {
                if (infoText === '' || infoText === undefined) {
                  infoText = 'nothing found'
                  this.setState(prevState => ({
                    ...prevState,
                    currInfo: infoText,
                  }));

                }
              }

            })
          }

        })

    }

  }

  async setRoutePrice() {
    if (!this.state.operator.currEnterToll && this.state.createdTools[0]) {
      await
        this.setState(prevState => ({
          ...prevState,
          operator: {
            ...prevState.operator,
            currEnterToll: this.state.createdTools[0].toll
          }
        }));

    }
    if ( !this.state.operator.currEnterToll) {
      this.showAlert("Missing enter toll");
      return;
    }
    if (!this.state.operator.currExitToll && this.state.createdTools[0]) {
      await
        this.setState(prevState => ({
          ...prevState,
          operator: {
            ...prevState.operator,
            currExitToll: this.state.createdTools[0].toll
          }
        }));
    } else if ( !this.state.operator.currExitToll) {
      this.showAlert("Missing exit toll");
      return;
    }

    if (await this.checkIsOperPresent()
    ) {
      var tempPrice = await
        Actions.setRoutePrice(this.state.currOper, this.state.operator.routePrice,
          this.state.operator.currEnterToll, this.state.operator.currExitToll, this.state.ownerOperator, this.state.defaultGas)
      if (tempPrice !== '' && tempPrice !== undefined) {
        this.setState(prevState => ({
          ...prevState,
          existedPrices: [...this.state.existedPrices, {
            enter: tempPrice[0].args.entryBooth,
            exit: tempPrice[0].args.exitBooth,
            price: tempPrice[0].args.priceWeis.toNumber(),
            sender: tempPrice[0].args.sender
          }],
        }));

      }
    }
    else {
      return;
    }

  }

  async createNewToll() {
    if (this.state.operator.tollAddr !== '' && this.state.operator.tollAddr !== undefined) {

      if (await this.checkIsOperPresent()) {
        var tollTmp = await
          Actions.addTollBooth(this.state.operator.tollAddr,
            this.state.currOper,
            this.state.ownerOperator,
            this.state.defaultGas)
        if (tollTmp !== '' && tollTmp !== undefined) {
          this.setState(prevState => ({
            ...prevState,
            tolls: [...this.state.tolls, this.state.operator.tollAddr],
            createdTools: [...this.state.createdTools, {
              operator: tollTmp[0].args.sender,
              toll: tollTmp[0].args.tollBooth
            }],
          }));
        }
      }
      else {
        return;
      }
    } else {
      this.showAlert("Missing toll address")
    }
  }


  async selectVehType(e) {
    const val = e.target.value;
    this.setState(prevState => ({
      ...prevState,
      currVehType: val
    }));
  }

  selectMultiplier(e) {
    const val = e.target.value;

    this.setState(prevState => ({
        ...prevState,
        operator: {
          ...prevState.operator,
          multiplier: val
        }
      })
    )
  }

  async setMultiplier() {

    if (await this.checkIsOperPresent()
    ) {
      if ((this.state.operator.currVehType === '' || this.state.operator.currVehType === undefined) && (this.state.createdVehicles[0] !== '' && this.state.createdVehicles[0] !== undefined)) {
        await
          this.setState(prevState => ({
            ...prevState,
            currVehType: this.state.createdVehicles[0].type
          }));
      } else if (this.state.operator.currVehType === undefined){
        this.showAlert("Missed vehicle type");
        return;
      }
      if (this.state.operator.multiplier === '' || this.state.operator.multiplier === undefined) {
        this.showAlert("Missed multiplier ");
        return;
      }
      var tempMult = await
        Actions.setMultiplier(this.state.currOper, this.state.currVehType,
          this.state.operator.multiplier, this.state.ownerOperator, this.state.defaultGas)
      if (tempMult !== '' && tempMult !== undefined) {
        this.setState(prevState => ({
          ...prevState,
          existedMultipl: [...this.state.existedMultipl, {
            type: tempMult[0].args.vehicleType.toNumber(),
            mult: tempMult[0].args.multiplier.toNumber(),
            sender: tempMult[0].args.sender
          }]
        }))
      }
    }
    else {
      return
    }
  }


  async selectEnterDeposit(e) {
    const val = e.target.value;
    this.setState(prevState => ({
        ...prevState,
        vehicle: {
          ...prevState.vehicle,
          deposit: val
        }
      })
    )
  }

  async selectPass(e) {
    const val = e.target.value;
    this.setState(prevState => ({
        ...prevState,
        vehicle: {
          ...prevState.vehicle,
          pass: val
        }
      })
    )
  }

  async selectVehicle(e) {
    const val = e.target.value;
    this.setState(prevState => ({
      ...prevState,
      currVehicle: val
    }))
    this.refreshBalance();
  }

  returnRegulator() {
    if (this.state.currPage === 0) {
      return (
        <Regulator
          operatorNewAddress={this.state.regulator.operatorAddr}
          operatorNewDeposit={this.state.regulator.depositOperator}
          vehicleNewAddress={this.state.regulator.vehicleAddr}
          vehicleNewType={this.state.regulator.vehicleType}
          lastOperatorAddress={this.state.lastOperatorAddr}
          changeOperatorAddress={e => this.changeOperatorAddress(e)}
          changeOperatorDeposit={e => this.changeOperatorDeposit(e)}
          createNewOperator={() => this.createNewOperator()}
          setVehicleType={() => this.setVehicleType()}
          changeVehicleType={e => this.changeVehicleType(e)}
          changeVehicleAddress={e => this.changeVehicleAddress(e)}
          lastVehicleAddress={this.state.lastVehicleAddr}
          operatorsArr={this.state.operators}
          createdVehicles={this.state.createdVehicles}

        />
      )
    } else if (this.state.currPage === 1) {

      return (
        <Operator
          operArr={this.state.operators}
          selectOper={e => this.selectOper(e)}
          currOper={this.state.currOper}
          createNewToll={() => this.createNewToll()}
          changeTollAddr={e => this.changeTollAddr(e)}
          tollsArr={this.state.tolls}
          selectEnterToll={e => this.selectEnterToll(e)}
          selectExitToll={e => this.selectExitToll(e)}
          changeRoadPrice={e => this.changeRoadPrice(e)}
          newRoadPrice={this.state.operator.routePrice}
          setRoutePrice={e => this.setRoutePrice(e)}
          vehicleTypes={this.state.vehicleTypes}
          currVehType={this.state.currVehType}
          selectVehType={e => this.selectVehType(e)}
          setMultiplier={() => this.setMultiplier()}
          selectMultiplier={e => this.selectMultiplier(e)}
          multiplier={this.state.operator.multiplier}
          currEnterToll={this.state.operator.currEnterToll}
          currExitToll={this.state.operator.currExitToll}
          createdTools={this.state.createdTools}
          existedPrices={this.state.existedPrices}
          createdVehicles={this.state.createdVehicles}
          existedMultipl={this.state.existedMultipl}
        />
      )
    } else if (this.state.currPage === 2) {
      return (
        <Vehicle
          vehiclesArr={this.state.vehicles}
          operatorsArr={this.state.operators}
          roadsArr={this.state.tolls}
          changeOperatorAddress={e => this.changeOperatorAddress(e)}
          selectEnterToll={e => this.selectEnterToll(e)}
          selectVehicle={e => this.selectVehicle(e)}
          selectOper={e => this.selectOper(e)}
          selectEnterDeposit={e => this.selectEnterDeposit(e)}
          selectPass={e => this.selectPass(e)}
          currPass={this.state.vehicle.pass}
          currDeposit={this.state.vehicle.deposit}
          currVeh={this.state.currVehicle}
          currOper={this.state.currOper}
          currEnterToll={this.state.operator.currEnterToll}
          enterRoad={() => this.enterRoad()}
          refreshBalance={() => this.refreshBalance()}
          vehBalance={this.state.vehicle.balance}
          createdVehicles={this.state.createdVehicles}
          createdTools={this.state.createdTools}
          vehiclesHistory={this.state.vehiclesHistory}
          unpauseOper={() => this.unpauseOper()}
          checkPause={() => this.checkPause()}
          isPaused={this.state.isPaused}
        />
      )
    } else if (this.state.currPage === 3) {
      return (
        <Toll
          operatorsArr={this.state.operators}
          roadsArr={this.state.tolls}
          currExitToll={this.state.operator.currExitToll}
          currOper={this.state.currOper}
          selectExitToll={e => this.selectExitToll(e)}
          selectOper={e => this.selectOper(e)}
          exitRoad={() => this.exitRoad()}
          createdTools={this.state.createdTools}
          loadInfo={() => this.loadInfo()}
          currPass={this.state.vehicle.pass}
          selectPass={e => this.selectPass(e)}
          currInfo={this.state.currInfo}
        />
      )
    }
  }


  render() {
    const activePlace = this.state.activePlace;
    return (
      <div>
        {this.renderAlert()}
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <h1 style={{fontSize: '30px'}}>B9lab final project</h1>
            </Navbar.Brand>
          </Navbar.Header>
        </Navbar>
        <Grid>
          <Row>
            <Col md={7} sm={7}>

              <Nav
                bsStyle="pills"
                stacked
                activeKey={activePlace}
                onSelect={index => {
                  this.setState({currPage: index});
                }}
              >
                {TABS.map((place, index) => (
                  <NavItem key={index} eventKey={index}>{place.name}</NavItem>
                ))}
              </Nav>
              {this.returnRegulator()}
            </Col>

          </Row>
        </Grid>
      </div>
    );
  }
}

export default App;