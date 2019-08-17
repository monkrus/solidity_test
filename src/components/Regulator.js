import React, {Component} from 'react';
import {FormControl, ButtonToolbar, Button, Label,Table} from "react-bootstrap";

class Regulator extends Component {

  render() {
    const operatorsAddr = this.props.operatorsArr.map((e, key) => {
      return <tr value={e}>{e}</tr>;
    })
    const vehiclesAddr = this.props.createdVehicles.map((e, key) => {
      return (
        <tbody>
        <tr>
        <td value={e}>{e.address}</td>
        <td value={e}>{e.type}</td>
        </tr>
        </tbody>
        );
    })
    return (
      <div>
        <h3>Create new Operator</h3>
        Address
        <FormControl
          name="Operator"
          type="text"
          value={this.props.operatorNewAddress}
          placeholder="Enter text"
          onChange={this.props.changeOperatorAddress}
        />
        Deposit
        <FormControl
          name="Deposit"
          type="number"
          min="0"
          value={this.props.operatorNewDeposit}
          placeholder="Enter deposit value"
          onChange={this.props.changeOperatorDeposit}
        />
        <br/>
        <h5><Label bsStyle="info"> Last operator address: {this.props.lastOperatorAddress} </Label>{' '}</h5>




        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large" onClick={this.props.createNewOperator} active>
            Create
          </Button>
        </ButtonToolbar>
        <br/>
        <Table responsive>
          <thead>
          <tr>
            <th>Operator address</th>
          </tr>
          </thead>
          <tbody>
          {operatorsAddr}
          </tbody>
        </Table>

        <h3>Vehicle type</h3>
        Address
        <FormControl
          name="Vehicle"
          type="text"
          value={this.props.vehicleNewAddress}
          placeholder="Enter vehicle addr"
          onChange={this.props.changeVehicleAddress}
        />
        Vehicle type
        <FormControl
          name="Type"
          type="number"
          min="0"
          value={this.props.vehicleNewType}
          placeholder="Enter vehicle type"
          onChange={this.props.changeVehicleType}
        />
        <br/>
        <h5><Label bsStyle="info"> Last vehicle address: {this.props.lastVehicleAddress} </Label>{' '}</h5>

        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large" onClick={this.props.setVehicleType} active>
            Set
          </Button>
        </ButtonToolbar>
        <Table responsive>
          <thead>
          <tr>
            <th>Vehicle address</th>
            <th>Vehicle type</th>
          </tr>
          </thead>
          {vehiclesAddr}
        </Table>
      </div>

    )
  }

}

export default Regulator;