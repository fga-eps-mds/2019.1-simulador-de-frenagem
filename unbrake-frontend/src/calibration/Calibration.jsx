import React from "react";
import { connect } from "react-redux";
import "../App.css";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { API_URL_GRAPHQL } from "../utils/Constants";
import CalibrationUpload from "./CalibrationUpload";
import Vibration from "./Vibration";
import Force from "./Force";
import Temperature from "./Temperature";
import Command from "./Command";
import Speed from "./Speed";
import Relation from "./Relation";
import { messageSistem } from "../actions/NotificationActions";
import Request, { createMutationUrl } from "../utils/Request";

import { redirectPage } from "../actions/RedirectActions";
import { changeCalibTest } from "../actions/TestActions";
import {
  allVariablesCalib,
  createAllCalibrations,
  variablesCalib,
  createCalibration,
  createDefaultCalibration,
  empty,
  labels,
  styles,
  dialogName,
  previousButton,
  nextButton
} from "./CalibrationVariables";

const generalConfigsOption = 0;
const temperatureOption = 1;
const forceOption = 2;
const speedOption = 3;
const vibrationOption = 4;
const commandOption = 5;
const relationOption = 6;
const sizeMessageDefault = 14;
const invalidID = -1;
let createMessage = "";

export const validateFields = (calibration, sendMessage) => {
  createMessage = allVariablesCalib.reduce((prevMessage, newDictionary) => {
    const newMessage = newDictionary.reduce((prevMessageTwo, newField) => {
      if (
        calibration[newField.front] === undefined ||
        calibration[newField.front].length === empty
      ) {
        if (prevMessageTwo.length === sizeMessageDefault)
          return `${prevMessageTwo} "${labels(newField.front)}"`;
        return `${prevMessageTwo}, "${labels(newField.front)}"`;
      }
      return prevMessageTwo;
    }, prevMessage);

    return newMessage;
  }, "O(s) campo(s) ");

  if (createMessage.length > sizeMessageDefault) {
    createMessage += " está(ão) vazios";
    sendMessage({
      message: createMessage,
      variante: "error",
      condition: true
    });
    return false;
  }
  return true;
};

const firstRequests = async values => {
  const calibrationParts = createAllCalibrations.map(async (value, number) => {
    const id = await createMutationUrl(
      value,
      allVariablesCalib[number],
      values.calibration
    );
    return { name: [value.name], id };
  });
  let calibration = await Promise.all(calibrationParts);
  calibration = calibration.reduce((initial, actual) => {
    initial[actual.name] = actual.id; // eslint-disable-line no-param-reassign
    return initial;
  }, {});

  return calibration;
};

export const saveCalibration = async (values, dispatchs) => {
  const { sendMessage, redirect, changeCalib } = dispatchs;

  const idsCalibration = await firstRequests(values);
  idsCalibration.name = values.name;

  const responseSaved = await createMutationUrl(
    values.createCalibration,
    variablesCalib,
    idsCalibration
  );

  if (responseSaved === invalidID) {
    sendMessage({
      message: "Falha no cadastro da calibração",
      variante: "error",
      condition: true
    });
  } else {
    sendMessage({
      message: "Calibração cadastrada com sucesso",
      variante: "success",
      condition: true
    });
    redirect({ url: "/test" });
  }

  changeCalib({ calibId: responseSaved });

  return responseSaved;
};

const GeneralConfigs = () => (
  <div>
    <div style={{ marginTop: "6%", marginBottom: "2%" }}>
      <CalibrationUpload />
    </div>
  </div>
);

const registerButton = handleValidate => {
  return (
    <Button color="secondary" variant="contained" onClick={handleValidate}>
      Cadastrar
    </Button>
  );
};

const appBar = (functions, classes, value) => {
  return (
    <div className={classes.root}>
      <Grid
        item
        xs={12}
        container
        justify="center"
        style={{ marginBottom: "15px" }}
      >
        <Grid item xs={3} container justify="center" alignItems="center">
          {previousButton(functions.handlePrevious)}
        </Grid>
        <Grid item xs={4} container justify="center" alignItems="center">
          {registerButton(functions.handleValidate)}
        </Grid>
        <Grid item xs={4} container justify="center" alignItems="center">
          {nextButton(functions.handleNext)}
        </Grid>
      </Grid>
      <AppBar position="static" color="inherit" className={classes.appBar}>
        <Tabs
          value={value}
          onChange={functions.handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Gerais" />
          <Tab label="Temperatura" />
          <Tab label="Força" />
          <Tab label="Velocidade" />
          <Tab label="Vibração" />
          <Tab label="Comando" />
          <Tab label="Relações" />
        </Tabs>
      </AppBar>
      {value === generalConfigsOption && GeneralConfigs()}
      {value === temperatureOption && <Temperature mqttKey={classes.mqttKey} />}
      {value === forceOption && <Force mqttKey={classes.mqttKey} />}
      {value === speedOption && <Speed mqttKey={classes.mqttKey} />}
      {value === vibrationOption && <Vibration mqttKey={classes.mqttKey} />}
      {value === commandOption && <Command mqttKey={classes.mqttKey} />}
      {value === relationOption && <Relation />}
    </div>
  );
};

class Calibration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      value: 0,
      name: "",
      isDefault: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleValidate = this.handleValidate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChangeStates = this.handleChangeStates.bind(this);
    this.handleIsDefault = this.handleIsDefault.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handlePrevious = this.handlePrevious.bind(this);
  }

  componentDidMount() {
    const url = `${API_URL_GRAPHQL}/mqtt-reading-key`;
    const method = "GET";
    Request(url, method).then(json => {
      this.setState({ mqttKey: json.key });
    });
  }

  handleNext() {
    const { redirect } = this.props;
    redirect({ url: "/test" });
  }

  handlePrevious() {
    const { redirect } = this.props;
    redirect({ url: "/configuration" });
  }

  handleIsDefault(event) {
    this.setState({ isDefault: event.target.checked });
  }

  handleClose() {
    this.setState({ open: false });
  }

  handleChange(event, value) {
    this.setState({ value });
  }

  handleChangeStates(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleValidate() {
    const { calibration, sendMessage } = this.props;

    const validate = validateFields(calibration.values, sendMessage);
    if (validate === false) return;

    const inserName = { open: true, isDefault: false, name: "" };
    this.setState(prevState => ({ ...prevState, ...inserName }));
  }

  handleSubmit() {
    const { calibration, sendMessage, redirect, changeCalib } = this.props;
    const { name, isDefault } = this.state;
    const dispatchs = { sendMessage, redirect, changeCalib };
    const values = { calibration: calibration.values, name, createCalibration };

    if (name === "") {
      sendMessage({
        message: "O nome é obrigatório para cadastrar a calibração",
        variante: "error",
        condition: true
      });

      return;
    }
    this.setState({ open: false });

    if (isDefault === true) values.createCalibration = createDefaultCalibration;
    else values.createCalibration = createCalibration;

    saveCalibration(values, dispatchs);
  }

  render() {
    const { classes } = this.props;
    const { value, name, open, isDefault, mqttKey } = this.state;
    const states = { name, open, isDefault };
    const functions = {
      handleClose: this.handleClose,
      handleChangeStates: this.handleChangeStates,
      handleSubmit: this.handleSubmit,
      handleChange: this.handleChange,
      handleValidate: this.handleValidate,
      handleIsDefault: this.handleIsDefault,
      handleNext: this.handleNext,
      handlePrevious: this.handlePrevious
    };
    classes.mqttKey = mqttKey;

    return (
      <Grid item container xs={12} justify="center" alignItems="center">
        <Grid item container xs={11} justify="center" alignItems="center">
          {appBar(functions, classes, value)}
        </Grid>
        {dialogName(functions, states)}
      </Grid>
    );
  }
}

Calibration.propTypes = {
  sendMessage: PropTypes.func.isRequired,
  redirect: PropTypes.func.isRequired,
  changeCalib: PropTypes.func.isRequired
};

Calibration.defaultProps = {
  calibration: { values: {} }
};

const mapDispatchToProps = dispatch => ({
  sendMessage: payload => dispatch(messageSistem(payload)),
  redirect: payload => dispatch(redirectPage(payload)),
  changeCalib: payload => dispatch(changeCalibTest(payload))
});

const mapStateToProps = state => ({
  calibration: state.form.calibration,
  calibId: state.testReducer.calibId
});

Calibration.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
  calibration: PropTypes.objectOf(PropTypes.string)
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(Calibration));
