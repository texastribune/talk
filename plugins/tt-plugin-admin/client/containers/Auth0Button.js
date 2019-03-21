import { connect } from "plugin-api/beta/client/hocs";
import { bindActionCreators } from "redux";
import { loginWithAuth0 } from "../actions";
import Auth0Button from "../components/Auth0Button";

const mapDispatchToProps = dispatch =>
  bindActionCreators({ onClick: loginWithAuth0 }, dispatch);

export default connect(
  null,
  mapDispatchToProps
)(Auth0Button);
