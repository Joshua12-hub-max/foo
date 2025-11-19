import jwt from "jsonwebtoken";

export const createAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXP || "15m" });
};

export const createRefreshToken = (payload) => {
  if (!process.env.REFRESH_SECRET) {
    throw new Error("REFRESH_SECRET is not defined");
  }
  return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXP || "7d" });
};

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.REFRESH_SECRET);