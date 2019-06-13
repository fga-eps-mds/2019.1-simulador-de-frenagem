import React from "react";
import iniparser from "iniparser";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";

import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { initialize, reduxForm } from "redux-form";
import { connect } from "react-redux";
import { addFile } from "../actions/FileActions";
import { API_URL_GRAPHQL } from "../utils/Constants";
import Request from "../utils/Request";
import { createQuery, allVariablesCalib, empty } from "./CalibrationVariables";

const styles = theme => ({
  title: {
    padding: "5px"
  },
  grid: {
    padding: "5px"
  },
  input_file_name: {
    marginLeft: 8,
    flex: 1
  },
  input: {
    display: "none"
  },
  rootUploadFile: {
    padding: "2px 4px",
    display: "flex",
    alignItems: "center",
    width: 400
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 200
  }
});

const calibrationJSON = [
  "calibrationtemperatureSet",
  "calibrationtemperatureSet",
  "calibrationforceSet",
  "calibrationforceSet",
  "speed",
  "vibration",
  "command",
  "relations"
];

const createCalibration = (data, dispatch) => {
  const nextPosition = 1;

  const cont = { calibrationtemperatureSet: -1, calibrationforceSet: -1 };

  const newCalibraiton = calibrationJSON.reduce(
    (prevDicionary, calibJSON, index) => {
      if (
        calibJSON === "calibrationtemperatureSet" ||
        calibJSON === "calibrationforceSet"
      )
        cont[calibJSON] += nextPosition;

      return allVariablesCalib[index].reduce((prevDictionaryTwo, variables) => {
        let subDictionay;

        if (
          calibJSON === "calibrationtemperatureSet" ||
          calibJSON === "calibrationforceSet"
        )
          subDictionay = {
            [variables.front]: data[calibJSON][cont[calibJSON]][variables.back]
          };
        else
          subDictionay = { [variables.front]: data[calibJSON][variables.back] };

        return { ...prevDictionaryTwo, ...subDictionay };
      }, prevDicionary);
    },
    {}
  );
  dispatch(initialize("calibration", newCalibraiton));
};

const getSelectCalibration = (id, dispatch) => {
  const query = createQuery();
  const url = `${API_URL_GRAPHQL}?query=query{calibration(id:${id}){${query}}}`;

  const method = "GET";

  Request(url, method).then(response => {
    const data = response.data.calibration;

    createCalibration(data, dispatch);
  });
};

const itensSelection = allCalibration => {
  let allCalib = [{ id: 0, name: "" }];
  allCalib = allCalib.concat(allCalibration);

  const itens = allCalib.map(value => {
    return (
      <MenuItem key={value.name + value.id} value={value.id}>
        {value.name}
      </MenuItem>
    );
  });
  return itens;
};

const selectConfiguration = (handleChange, calibStates, classes) => {
  return (
    <Grid item xs={4} className={classes.title}>
      <TextField
        id="outlined-select-currency"
        select
        label="Calibrações"
        value={calibStates[0]}
        onChange={handleChange}
        name="dataBaseCalibration"
        className={classes.formControl}
        margin="normal"
        variant="outlined"
      >
        {itensSelection(calibStates[1])}
      </TextField>
    </Grid>
  );
};

const defaultButton = handleUpDefault => {
  return (
    <Button onClick={handleUpDefault} color="secondary" variant="contained">
      Calibração Padrão
    </Button>
  );
};

class CalibrationUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataBaseCalibration: 0,
      allCalibration: ""
    };

    this.fileUpload = this.fileUpload.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleUpDefault = this.handleUpDefault.bind(this);
  }

  componentDidMount() {
    const url = `${API_URL_GRAPHQL}?query=query{allCalibration{id, name, isDefault}}`;
    const method = "GET";
    Request(url, method).then(json => {
      const data = json.data.allCalibration;
      this.setState({ allCalibration: data });
    });
  }

  handleChange(event) {
    const { dispatch } = this.props;

    this.setState({ [event.target.name]: event.target.value });
    const invalidId = 0;
    if (
      event.target.name === "dataBaseCalibration" &&
      event.target.value > invalidId
    )
      getSelectCalibration(event.target.value, dispatch);

    // this.handleSelectCalibration(event.target.value);
  }

  handleSelectCalibration(id) {
    const { dispatch } = this.props;

    const query = createQuery();
    const url = `${API_URL_GRAPHQL}?query=query{calibration(id:${id}){${query}}}`;

    const method = "GET";

    Request(url, method).then(response => {
      const data = response.data.calibration;

      createCalibration(data, dispatch);
    });
  }

  handleUpDefault() {
    const { dispatch } = this.props;
    const { allCalibration } = this.state;

    const defaultsCalib = allCalibration.filter(calibration => {
      return calibration.isDefault === true;
    });

    if (defaultsCalib.length > empty)
      getSelectCalibration(defaultsCalib[0].id, dispatch);
  }

  uploadField(field, filename) {
    const { classes } = this.props;

    let archive;

    if (field === "calibration") archive = "Calibração";

    return (
      <Grid container item xs={10} alignItems="center" justify="center">
        <Grid item xs={4} className={classes.title}>
          <h2 justify="left">Upload arquivo de {archive}</h2>
        </Grid>
        <Grid item xs={4} className={classes.grid}>
          <label htmlFor="contained-button-file">
            <input
              id="contained-button-file"
              type="file"
              name={field}
              className={classes.input}
              onChange={e => this.fileUpload(e.target.files[0], field)}
            />
            <Paper className={classes.rootUploadFile}>
              <IconButton component="span">
                <CloudUploadIcon style={{ color: "black" }} />
              </IconButton>
              <span>{filename}</span>
            </Paper>
          </label>
        </Grid>
      </Grid>
    );
  }

  fileUpload(file, name) {
    const { addFileName } = this.props;
    addFileName(file.name);
    const formData = new FormData();
    formData.append("file", name);
    const reader = new FileReader();
    const { dispatch } = this.props;

    reader.onload = e => {
      const content = e.target.result;
      const fileUpload = iniparser.parseString(content);

      if (name === "calibration") {
        const calibration = {
          ...fileUpload.CALIBRA_TEMPERATURA,
          ...fileUpload.CALIBRA_VIBRACAO,
          ...fileUpload.CALIBRA_FORCA,
          ...fileUpload.CALIBRA_VELOCIDADE,
          ...fileUpload.CALIBRA_COMANDO,
          ...fileUpload.CALIBRA_RELACOES
        };
        dispatch(initialize("calibration", calibration));
      }
    };

    reader.readAsText(file, "UTF-8");
  }

  render() {
    const { filename, classes } = this.props;
    const { dataBaseCalibration, allCalibration } = this.state;

    const calibStates = [dataBaseCalibration, allCalibration];

    return (
      <Grid alignItems="center" justify="center" container>
        {this.uploadField("calibration", filename)}
        <Grid container justify="center" item alignItems="center" xs={12}>
          {selectConfiguration(this.handleChange, calibStates, classes)}
          {defaultButton(this.handleUpDefault)}
        </Grid>
      </Grid>
    );
  }
}

CalibrationUpload.defaultProps = {
  filename: ""
};

CalibrationUpload.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
  addFileName: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  filename: PropTypes.string
};

const mapDispatchToProps = dispatch => ({
  addFileName: value => dispatch(addFile(value))
});

const mapStateToProps = state => ({
  filename: state.fileReducer.filename
});

const Upload = reduxForm({
  form: "calibration",
  destroyOnUnmount: false
})(CalibrationUpload);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(Upload));
