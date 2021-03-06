import React from "react";
import { connect } from "react-redux";
import { reduxForm, SubmissionError } from "redux-form";

import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import history from "../utils/history";
import { API_URL_GRAPHQL } from "../utils/Constants";
import { messageSistem } from "../actions/NotificationActions";
import NotificationContainer from "./Notification";

import FieldComponent from "./FieldComponent";
import { renderSubmit, propTypes, authStyles } from "./AuthForm";
import paperAuth from "../styles/AuthStyle";

const minCaracters = 8;

const styles = authStyles;

export const validate = values => {
  const errors = {};
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "As senhas não são iguais";
  }
  return errors;
};

export const required = value =>
  value || typeof value === "number" ? undefined : "Obrigatório";

export const minLength = min => value =>
  value && value.length < min
    ? `Deve ter ${min} caracteres ou mais`
    : undefined;

export const validateEmail = value =>
  value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
    ? "Endereço de email inválido"
    : undefined;

export const submit = async (sendMessage, values) => {
  return fetch(
    `${API_URL_GRAPHQL}?query=mutation{createUser(password: "${
      values.password
    }", email: "${values.email}"
     username: "${values.username}",
     isSuperuser: false){user{id}}}`,
    {
      method: "POST"
    }
  )
    .then(response => {
      return response.json();
    })
    .then(parsedData => {
      if (parsedData.errors !== undefined) {
        if (
          parsedData.errors[0].message ===
          "UNIQUE constraint failed: auth_user.username"
        ) {
          throw new SubmissionError({
            username: "O usuário já está em uso",
            _error: "Login failed!"
          });
        }
      } else if (parsedData.data.createUser.user !== null) {
        sendMessage({
          message: "Usuário cadastrado com sucesso",
          variante: "success",
          condition: true
        });
        history.push("/");
      }
    });
};
const signUpPaper = params => {
  return (
    <Paper className={params.classes.paper} elevation={10}>
      <Typography
        variant="h4"
        color="secondary"
        className={params.classes.grid}
      >
        Registre-se
      </Typography>
      <form
        onSubmit={params.handleSubmit(submit.bind(this, params.sendMessage))}
      >
        <FieldComponent
          data={{
            name: "username",
            label: "Usuario",
            type: "text",
            validate: required
          }}
        />
        <FieldComponent
          data={{
            name: "email",
            label: "Email",
            type: "email",
            validate: [required, validateEmail]
          }}
        />
        <FieldComponent
          data={{
            name: "password",
            label: "Senha",
            type: "password",
            validate: [required, minLength(minCaracters)]
          }}
        />
        <FieldComponent
          data={{
            name: "confirmPassword",
            label: "Confirme a Senha",
            type: "password",
            validate: required
          }}
        />
        {renderSubmit("Registrar", params.classes, params.submitting)}
      </form>
    </Paper>
  );
};

class SignUp extends React.PureComponent {
  render() {
    const params = this.props;
    return (
      <div style={paperAuth}>
        {signUpPaper(params)}
        <NotificationContainer />
      </div>
    );
  }
}

SignUp.propTypes = propTypes;
const SignUpForm = reduxForm({
  form: "signup",
  validate
})(SignUp);

const mapStateToProps = state => ({
  message: state.notificationReducer.message,
  variante: state.notificationReducer.variante
});

const mapDispatchToProps = dispatch => ({
  sendMessage: payload => dispatch(messageSistem(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(SignUpForm));
