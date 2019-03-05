const Users = require("services/users");
const { get } = require("lodash");

module.exports = {
  resolvers: {
    User: {
      username: user => get(user, "metadata.displayName", get(user, "username"))
    }
  },

  tokenUserNotFound: async ({ jwt, token }) => {
    if (!token) return null;

    const userId = jwt.sub;
    const providerName = jwt.iss;
    const username = jwt.nickname;
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

      user.roles = isStaff ? "STAFF" : "COMMENTER";
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
