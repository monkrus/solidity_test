import React, {Component} from 'react';
import { Button, FormControl, ButtonToolbar, Label, Table} from "react-bootstrap";


class Vehicle extends Component {
  componentDidMount() {
    this.props.refreshBalance();
  }

  render() {
    const operators = this.props.operatorsArr.map((e, key) => {

      return <option value={e}>{e}</option>;
    })
    const tolls = this.props.createdTools.map((e, key) => {
      return <option value={e.toll}>{e.toll}</option>;
    })
    const vehicls = this.props.createdVehicles.map((e, key) => {
      return <option value={e.address}>{e.address}</option>;
    })
    const vehicleWays = this.props.vehiclesHistory.map((e, key) => {
      return (
        <tbody>
        <tr>
          <td value={key.price}>{e.vehicle}</td>
          <td value={key.enter}>{e.enter}</td>
          <td value={key.exit}>{e.exit}</td>

        </tr>
        </tbody>
      );
    })

    return (
      <div>
        <h3>Vehicle</h3>
        <h5><Label bsStyle="info"> Balance: {this.props.vehBalance}</Label>{' '}</h5><br/>
        <h5><Label bsStyle="info"> Operator paused: {this.props.isPaused.toString()}</Label>{' '}</h5><br/>
        <Button bsStyle="primary" bsSize="large" disabled={!this.props.isPaused} onClick={this.props.unpauseOper}>
          Unpause
        </Button>
        <Table responsive>
          <thead>
          <tr>
            <th> Select vehicle</th>
            <th> Select Operator</th>
            <th> Select entry booth</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td><select title="Vehicle" id="split-button-pull-right" value={this.props.currVeh}
                        onChange={this.props.selectVehicle}>
              {vehicls}
            </select></td>
            <td><select title="Operator" id="split-button-pull-right" value={this.props.currOper}
                        onChange={this.props.selectOper}>
              {operators}
            </select></td>
            <td><select title="Entry road" id="split-button-pull-right" value={this.props.currEnterToll}
                        onChange={this.props.selectEnterToll}>
              {tolls}
            </select></td>
          </tr>
          </tbody>
        </Table>
        <br/>
        Set secret
        <FormControl
          name="Secret"

          type="text"
          min="0"
          value={this.props.currPass}
          placeholder="Enter pass"
          onChange={this.props.selectPass}
        />
        <br/>
        Set enter deposit
        <FormControl
          name="Deposit"
          type="number"
          min="0"
          value={this.props.currDeposit}
          placeholder="Enter deposit value"
          onChange={this.props.selectEnterDeposit}
        />
        <br/>
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large" onClick={this.props.enterRoad} disabled={this.props.isPaused}>
            Enter
          </Button>
        </ButtonToolbar>
        <Table responsive>
          <thead>
          <tr>
            <th>Vehicle address</th>
            <th>Road enter</th>
            <th>Road exit</th>

          </tr>
          </thead>
          {vehicleWays}
        </Table>
      </div>
    )
  }

}

export default Vehicle;