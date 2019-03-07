module.exports = router => {
  router.get("/api/v1/auth/auth0", (req, res, next) => {
    const {
      connectors: {
        services: {
          Passport: { passport }
        }
      }
    } = req.context;

    return passport.authenticate("auth0", {
      connection: "texastribune-org"
    })(req, res, next);
  });

  router.get("/api/v1/auth/auth0/callback", (req, res, next) => {
    const {
      connectors: {
        services: {
          Passport: { passport, HandleAuthPopupCallback }
        }
      }
    } = req.context;

    passport.authenticate(
      "auth0",
      {
        session: false,
        failureRedirect: "https://www.texastribune.org/"
      },
      HandleAuthPopupCallback(req, res, next)
    )(req, res, next);
  });
};
