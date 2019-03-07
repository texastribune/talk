import { handlePopupAuth } from "plugin-api/beta/client/utils";

export const loginWithAuth0 = () => (dispatch, _, { rest }) => {
  handlePopupAuth(`${rest.uri}/auth/auth0`);
};
