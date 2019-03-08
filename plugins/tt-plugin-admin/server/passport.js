const Auth0Strategy = require("passport-auth0");
const UsersService = require("services/users");
const { ValidateUserLogin } = require("services/passport");
let { ROOT_URL } = require("config");

if (ROOT_URL[ROOT_URL.length - 1] !== "/") {
  ROOT_URL += "/";
}

module.exports = passport => {
  if (
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.TALK_ROOT_URL
  ) {
    passport.use(
      new Auth0Strategy(
        {
          domain: process.env.AUTH0_DOMAIN,
          clientID: process.env.AUTH0_CLIENT_ID,
          clientSecret: process.env.AUTH0_CLIENT_SECRET,
          callbackURL: `${ROOT_URL}api/v1/auth/auth0/callback`,
          state: false
        },
        async (accessToken, refreshToken, extraParams, profile, done) => {
          let user;
          console.log('passport', profile);
          try {
            const userId = profile.sub;
            const providerName = profile.iss;
            const username = profile.nickname;
            const emailIsVerified = profile.email_verified;
            const email = profile.email.toLowerCase();
            const isStaff = profile["https://texastribune.org/is_staff"];

            if (!emailIsVerified) throw new Error("Email not verified");

            user = await UsersService.upsertExternalUser(
              null,
              userId,
              providerName,
              username
            );
            user.role = isStaff ? "STAFF" : "COMMENTER";
            user.profiles.push({
              provider: "local",
              id: email
            });
            await user.save();
          } catch (err) {
            return done(err);
          }

          return ValidateUserLogin(profile, user, done);
        }
      )
    );
  } else if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Auth0 cannot be enabled, missing one of AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, TALK_ROOT_URL"
    );
  }
};

