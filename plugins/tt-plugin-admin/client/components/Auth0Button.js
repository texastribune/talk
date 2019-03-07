import React from "react";
import { BareButton } from "plugin-api/beta/client/components/ui";
import styles from "./Auth0Button.css";

export default ({ onClick, children }) => {
  return (
    <BareButton className={styles.button} onClick={onClick}>
      {children}
    </BareButton>
  );
};
