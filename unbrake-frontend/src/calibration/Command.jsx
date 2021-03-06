import React from "react";
import PropTypes from "prop-types";
import { reduxForm, change } from "redux-form";
import { connect } from "react-redux";
import { withStyles, Grid } from "@material-ui/core";
import * as emitter from "emitter-io";
import styles from "../components/Styles";
import RealTimeChart from "../components/RealTimeChart";
import { field } from "../components/ComponentsForm";
import { MQTT_HOST, MQTT_PORT } from "../utils/Constants";
import {
  base10,
  convertDigitalToAnalog,
  dutyCycleEquation
} from "../utils/Equations";
import { changeCalibTest } from "../actions/TestActions";

const invalidId = 0;

const labelSecondary = name => {
  let nameLabel = "";
  switch (name) {
    case "CHVC":
      nameLabel = "Canal - comando / velocidade";
      break;
    case "CHPC":
      nameLabel = "Canal - comando / pressão";
      break;
    case "CUVC":
      nameLabel = "Velocidade (km/h)";
      break;
    case "CUPC":
      nameLabel = "Pressão (Bar)";
      break;
    default:
      nameLabel = "";
      break;
  }
  return nameLabel;
};

export const labelCommand = name => {
  let nameLabel = "";
  switch (name) {
    case "MAVC":
      nameLabel = "Velocidade máxima (kmh)";
      break;
    case "MAPC":
      nameLabel = "Pressão máxima (Bar)";
      break;
    case "Vdc":
      nameLabel = "Velocidade (Duty Cycle)";
      break;
    case "Pdc":
      nameLabel = "Pressão (Duty Cycle)";
      break;
    case "VCmv":
      nameLabel = "Velocidade comando (mV)";
      break;
    case "PCmv":
      nameLabel = "Pressão comando (mV)";
      break;
    default:
      nameLabel = labelSecondary(name);
      break;
  }
  return nameLabel;
};

const renderField = (states, classes, handleChange) => {
  const type = states;
  type.label = labelCommand(states.name);
  return <React.Fragment>{field(type, classes, handleChange)}</React.Fragment>;
};

const rowField = (states, classes, handleChange) => {
  const fields = states.map(value => {
    return (
      <Grid
        key={`component ${value.name}`}
        alignItems="center"
        justify="center"
        container
        item
        xs={6}
      >
        {renderField(value, classes, handleChange)}
      </Grid>
    );
  });
  return fields;
};

const allFields = (states, classes, handleChange) => {
  const fields = states.map(value => {
    return (
      <Grid
        alignItems="center"
        justify="center"
        container
        item
        xs={12}
        key={`fields ${value[1].name}`}
      >
        {rowField(value, classes, handleChange)}
      </Grid>
    );
  });
  return fields;
};

const renderDictionary = command => {
  const directionary = [
    [
      { name: "CHVC", value: command.CHVC, disable: true },
      { name: "CHPC", value: command.CHPC, disable: true }
    ],
    [
      { name: "Vdc", value: command.Vdc, disable: true },
      { name: "Pdc", value: command.Pdc, disable: true }
    ],
    [
      { name: "VCmv", value: command.VCmv, disable: true },
      { name: "PCmv", value: command.PCmv, disable: true }
    ],
    [
      { name: "CUVC", value: command.CUVC, disable: false },
      { name: "CUPC", value: command.CUPC, disable: false }
    ],
    [
      { name: "MAVC", value: command.MAVC, disable: false },
      { name: "MAPC", value: command.MAPC, disable: false }
    ]
  ];
  return directionary;
};

class Command extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      command: {
        CHVC: "", // Canal - comando / velocidade
        CHPC: "", // Canal - comando / pressão
        CUVC: "", // Velocidade (km/h)
        CUPC: "", // Pressão (Bar)
        MAVC: "", // Velocidade máxima (kmh)
        MAPC: "", // Pressão máxima (Bar)
        Vdc: "", // Velocidade (Duty Cycle)
        Pdc: "", // Pressão (Duty Cycle)
        VCmv: "", // Velocidade comando (mV)
        PCmv: "" // Pressão comando (mV)
      }
    };
    this.client = emitter.connect({
      host: MQTT_HOST,
      port: MQTT_PORT,
      secure: false
    });
    this.client.subscribe({
      key: props.mqttKey,
      channel: "unbrake/galpao/speed"
    });
    this.client.subscribe({
      key: props.mqttKey,
      channel: "unbrake/galpao/pressure"
    });
    this.sensor1 = [];
    this.sensor2 = [];
    this.handleChange = this.handleChange.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    const { values } = props.calibration;
    const dutyCycleSpeed = dutyCycleEquation(values.CUVC, values.MAVC);
    const dutyCyclePressure = dutyCycleEquation(values.CUPC, values.MAPC);

    props.dispatch(change("calibration", "Vdc", dutyCycleSpeed));
    props.dispatch(change("calibration", "Pdc", dutyCyclePressure));
    return {
      relation: {
        ...state.relation,
        ...{ Vdc: dutyCycleSpeed, Pdc: dutyCyclePressure }
      }
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    this.client.on("message", msg => {
      const analogMsg = convertDigitalToAnalog(
        parseInt(msg.asString(), base10)
      );
      if (msg.channel === "unbrake/galpao/speed/") {
        this.sensor1.push(analogMsg);
        dispatch(change("calibration", "VCmv", analogMsg));
      } else if (msg.channel === "unbrake/galpao/pressure/") {
        this.sensor2.push(analogMsg);
        dispatch(change("calibration", "PCmv", analogMsg));
      }
    });
  }

  handleChange(event) {
    const { calibId, changeCalib } = this.props;
    const { target } = event;

    const value = target.type === "checkbox" ? target.checked : target.value;
    const command = { [event.target.name]: value };
    this.setState(prevState => ({
      command: { ...prevState.command, ...command }
    }));

    if (calibId > invalidId) changeCalib({ calibId: "" });
  }

  render() {
    const { classes } = this.props;
    const { command } = this.state;
    const states = renderDictionary(command);
    return (
      <Grid
        container
        xs={12}
        item
        justify="center"
        style={{ marginTop: "10px" }}
      >
        <Grid alignItems="center" justify="center" container>
          <form className={classes.container}>
            <Grid item xs />
            <Grid container item justify="center" xs={6}>
              {allFields(states, classes, this.handleChange)}
            </Grid>
            <Grid item xs />
          </form>
        </Grid>

        <Grid
          item
          container
          xs={9}
          justify="center"
          className={classes.gridGraphic}
        >
          <RealTimeChart
            sensor1={this.sensor1}
            sensor2={this.sensor2}
            labelSensor1="Velocidade"
            colorSensor1="#133e79"
            labelSensor2="Pressão"
            colorSensor2="#348941"
          />
        </Grid>
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  return {
    calibration: state.form.calibration,
    calibId: state.testReducer.calibId
  };
}

Command.defaultProps = {
  calibration: { values: {} },
  calibId: ""
};

const mapDispatchToProps = dispatch => ({
  changeCalib: payload => dispatch(changeCalibTest(payload))
});

Command.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
  mqttKey: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  calibration: PropTypes.objectOf(PropTypes.string),
  calibId: PropTypes.number,
  changeCalib: PropTypes.func.isRequired
};

const CommandForm = reduxForm({
  form: "calibration",
  destroyOnUnmount: false
})(Command);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(CommandForm));
