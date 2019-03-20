const Users = require("services/users");
const { get } = require("lodash");

const isAtLeastStaff = role => (
  role === 'STAFF' || role === 'ADMIN' || role === 'MODERATOR'
);

module.exports = {
  resolvers: {
    User: {
      username(user) {
        const fullName = get(user, "metadata.fullName");

        if (fullName && isAtLeastStaff(user.role)) {
          return fullName;
        }
        return get(user, "metadata.displayName", get(user, "username"));
      }
    }
  },

  tokenUserNotFound: async ({ jwt, token }) => {
    if (!token) return null;

    const userId = jwt.sub;
    const providerName = jwt.iss;
    const username = jwt.nickname;
    const firstName = jwt.given_name;
    const lastName = jwt.family_name;
    const emailIsVerified = jwt.email_verified;
    const email = jwt.email.toLowerCase();
    const isStaff = jwt["https://texastribune.org/is_staff"];

    // you must verify your email to comment
    if (!emailIsVerified) return null;

    try {
      const user = await Users.upsertExternalUser(
        null,
        userId,
        providerName,
        username
      );

      if (firstName && lastName) {
        user.metadata.fullName = `${firstName} ${lastName}`;
      }
      user.role = isStaff ? "STAFF" : "COMMENTER";
      user.profiles.push({
        provider: "local",
        id: email
      });

      await user.save();
      return user;
    } catch (err) {
      return null;
    }
  }
};
