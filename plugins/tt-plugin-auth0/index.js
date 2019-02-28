const Users = require("services/users");

module.exports = {
  tokenUserNotFound: async ({ jwt, token }) => {
    if (!token) return null;

    const userId = jwt.sub;
    const providerName = jwt.iss;
    const username = jwt.nickname;
    const emailIsVerified = jwt.email_verified;
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

      user.roles = [isStaff ? "STAFF" : "COMMENTER"];
      await user.save();

      return user;
    } catch (err) {
      return null;
    }
  }
};
