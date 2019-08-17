import React, {Component} from 'react';
import { Label, Button,FormControl, ButtonToolbar,Table} from "react-bootstrap";


class IndividualToll extends Component {
  render() {
    const operators = this.props.operatorsArr.map((e, key) => {
      return <option value={e}>{e}</option>;
    })
    const tolls = this.props.createdTools.map((e, key) => {
      return <option value={e.toll}>{e.toll}</option>;
    })
    return (
      <div>
        <h3>Individual toll booth</h3>
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
        <Table responsive>
          <thead>
          <tr>
            <th> Select operator:</th>
            <th> Select exit road</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td><select title="Operator"  id="split-button-pull-right" value={this.props.currOper} onChange={this.props.selectOper}>
              {operators}
            </select></td>
            <td><select title="Exit booth"  id="split-button-pull-right" value={this.props.currExitToll} onChange={this.props.selectExitToll}>
              {tolls}
            </select></td>
          </tr>
          </tbody>
        </Table>
        <br/>
        <br/>
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large" onClick={this.props.exitRoad} active>
            Submit
          </Button>
        </ButtonToolbar>
        <br/>
        Get info by password
        <FormControl
          name="Passwd"
          type="text"
          placeholder="Enter your password"
          value={this.props.currPass}
          onChange={this.props.selectPass}
        />
        <br/>
        <h5><Label bsStyle="info">{this.props.currInfo}</Label></h5>
        <ButtonToolbar>
          <Button bsStyle="primary" bsSize="large" onClick={this.props.loadInfo}  active>
            Get Info
          </Button>
        </ButtonToolbar>
      </div>
    )
  }

}

export default IndividualToll;