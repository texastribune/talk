import SignIn from "./components/SignIn";

export default {
  slots: {
    authExternalAdminSignIn: [SignIn],
    authExternalSignIn: [() => null],
    authExternalSignUp: [() => null]
  }
};
