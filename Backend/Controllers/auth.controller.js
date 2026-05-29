import bcrypt from "bcryptjs";
import crypto from "crypto";

import { UserModel } from "../Models/user.js";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/generateToken.js";
import { persistAvatarFile } from "../middlewares/upload.middleware.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
});

export const registerUser = async (req, res, next) => {
  try {
    const name = (req.body?.name || req.body?.userName || req.body?.username || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl = "";
    if (req.file) {
      avatarUrl = persistAvatarFile(req.file);
    }

    const user = await UserModel.create({
      name,
      username: req.body?.username || name,
      email,
      password: hashedPassword,
      avatarUrl,
    });

    const accessToken = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    const refreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
    });

    // Hash refresh token using SHA256 and store in user document
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    user.refreshTokens = [hashedToken];
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const accessToken = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    const refreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
    });

    // Hash refresh token and save it in user document
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    user.refreshTokens = user.refreshTokens || [];
    if (user.refreshTokens.length >= 10) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push(hashedToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again.",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again.",
      });
    }

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again.",
      });
    }

    // Verify token exists in database (revocation check)
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    if (!user.refreshTokens || !user.refreshTokens.includes(hashedToken)) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again.",
      });
    }

    const newAccessToken = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    const newRefreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
    });

    // Refresh Token Rotation: Replace old token with the new one
    const newHashedToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedToken);
    user.refreshTokens.push(newHashedToken);
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        const user = await UserModel.findById(decoded.id);
        if (user) {
          const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
          user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedToken);
          await user.save();
        }
      }
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

