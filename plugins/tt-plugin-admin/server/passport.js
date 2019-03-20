const jwt = require("jsonwebtoken");
const Auth0Strategy = require("passport-auth0");

const UsersService = require("services/users");
const MetadataService = require("services/metadata");
const { ValidateUserLogin } = require("services/passport");
const UserModel = require("models/user");
let { ROOT_URL } = require("config");

if (ROOT_URL[ROOT_URL.length - 1] !== "/") {
  ROOT_URL += "/";
}

const hasLocalProfile = profiles => {
  const profilesWithLocal = profiles.filter(
    profile => profile.provider === "local"
  );
  return profilesWithLocal.length > 0;
};

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

          try {
            const emailIsVerified = profile._json.email_verified;

            if (!emailIsVerified) {
              throw new Error("Email not verified");
            }

            const userId = profile._json.sub;
            const username = profile._json.nickname;
            const firstName = profile._json.given_name;
            const lastName = profile._json.family_name;
            const email = profile._json.email.toLowerCase();
            const isStaff = profile._json["https://texastribune.org/is_staff"];

            const { iss: providerName } = jwt.decode(extraParams.id_token);

            user = await UsersService.upsertExternalUser(
              null,
              userId,
              providerName,
              username
            );

            if (firstName && lastName) {
              MetadataService.set(
                UserModel,
                userId,
                "fullName",
                `${firstName} ${lastName}`
              );
            }
            if ((!firstName || !lastName) && user.metadata.fullName) {
              MetadataService.unset(UserModel, userId, 'fullName');
            }

            if (!hasLocalProfile(user.profiles)) {
              user.profiles.push({
                provider: "local",
                id: email
              });
            }

            if (user.role === "COMMENTER" && isStaff) {
              user.role = "STAFF";
            }

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
