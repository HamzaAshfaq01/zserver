import jwt from "jsonwebtoken";
import * as config from "../config/config.js";

export const userAndTokenResponse = (req, res, user, YourHead) => {
  const token = jwt.sign({ id: user._id }, config.JWT_SECRET_KEY, {
    // expiresIn: "500d",
  });
  const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET_KEY, {
    // expiresIn: "500d",
  });
  user.password = undefined;
  user.resetCode = undefined;

  return res.json({
    token,
    refreshToken,
    user,
    YourHead,
  });
};
