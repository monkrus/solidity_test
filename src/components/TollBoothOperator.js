import React, {Component} from 'react';
import { Button, FormControl, ButtonToolbar, Table} from "react-bootstrap";


class TollBoothOperator extends Component {

  render() {
    const operators = this.props.operArr.map((e, key) => {
      return <option value={e}>{e}</option>;
    })
    const tolls = this.props.createdTools.map((e, key) => {
      return <option value={e.toll}>{e.toll}</option>;
    })
    const vehicleTypes = this.props.createdVehicles.map((e, key) => {
      return <option value={e.type}>{e.type}</option>;
    })
    const tollsArr = this.props.createdTools.map((e, key) => {
      return (
        <tbody>
        <tr>
          <td value={e.toll}>{e.toll}</td>
          <td value={e.operator}>{e.operator}</td>
        </tr>
        </tbody>
      );
    })
    const multArr = this.props.existedMultipl.map((e, key) => {

      return (
        <tbody>
        <tr>
          <td value={key.type}>{e.type}</td>
          <td value={key.mult}>{e.mult}</td>
          <td value={key.sender}>{e.sender}</td>
        </tr>
        </tbody>
      );
    })
    const pricesArr = this.props.existedPrices.map((e, key) => {
      return (
        <tbody>
        <tr>
          <td value={key.enter}>{e.enter}</td>
          <td value={key.exit}>{e.exit}</td>
          <td value={key.price}>{e.price}</td>
          <td value={key.sender}>{e.sender}</td>
        </tr>
        </tbody>
      );
    })
    return (
      <div>

        <h3>Create new Toll Booth</h3>
        <br/>
        Select operator:
        <br/>
        <select value={this.props.currOper} onChange={this.props.selectOper}>
          {operators}
        </select>
        <br/>


        Toll Booth address
        <FormControl
          name="TollAddr"
          type="text"
          min="0"
          value={this.props.tollNewAddr}
          placeholder="Enter new address"
          onChange={this.props.changeTollAddr}
        />
        <br/>
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large"  onClick={this.props.createNewToll} active>
            Add
          </Button>
        </ButtonToolbar>
        <Table responsive>
          <thead>
          <tr>
            <th>Toll address</th>
            <th>Toll operator</th>
          </tr>
          </thead>

          {tollsArr}

        </Table>
        <br/>
        <h3>Add base route price</h3>


        <br/>
        <Table responsive>
          <thead>
          <tr>
            <th> Enter booth</th>
            <th>Exit booth</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td> <select value={this.props.currEnterToll} onChange={this.props.selectEnterToll}>
              {tolls}
            </select></td>
            <td><select value={this.props.currExitToll} onChange={this.props.selectExitToll}>
              {tolls}
            </select></td>
          </tr>
          </tbody>
        </Table>


        <br/>
        Set price
        <FormControl
          name="Price"
          type="number"
          min="0"
          value={this.props.newRoadPrice}
          placeholder="Enter new road price"
          onChange={this.props.changeRoadPrice}
        />
        <br/>
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large" onClick={this.props.setRoutePrice} active>
            Add
          </Button>
        </ButtonToolbar>
        <Table responsive>
          <thead>
          <tr>
            <th>Toll enter</th>
            <th>Toll exit</th>
            <th>Price</th>
            <th>Operator</th>
          </tr>
          </thead>
          {pricesArr}
        </Table>
        <h3>Set multiplier</h3>
        <h5>Set type</h5>
        <select value={this.props.currVehType} onChange={this.props.selectVehType}>
          {vehicleTypes}
        </select>
        <br/>
        Set multiplier
        <FormControl
          type="number"
          min="0"
          value={this.props.multiplier}
          placeholder="Enter multiplier value"
          onChange={this.props.selectMultiplier}
        />
        <br/>
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large"  onClick={this.props.setMultiplier} active>
            Add
          </Button>
        </ButtonToolbar>
        <Table responsive>
          <thead>
          <tr>
            <th>Vehicle type</th>
            <th>Multiplier</th>
            <th>Sender</th>
          </tr>
          </thead>
          {multArr}
        </Table>

      </div>
    )
  }

}

export default TollBoothOperator;