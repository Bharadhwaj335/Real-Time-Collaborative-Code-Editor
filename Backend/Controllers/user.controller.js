import { UserModel } from "../Models/user.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
});

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user?.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const getUsers = async (_req, res, next) => {
  try {
    const users = await UserModel.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: users.map(toSafeUser),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const hasName = Object.prototype.hasOwnProperty.call(req.body || {}, "name");
    const hasEmail = Object.prototype.hasOwnProperty.call(req.body || {}, "email");

    if (!hasName && !hasEmail) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update.",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (hasName) {
      const nextName = String(req.body?.name || "").trim();
      const previousName = user.name;

      if (!nextName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      const shouldMirrorUsername = !user.username || user.username === previousName;
      user.name = nextName;

      if (shouldMirrorUsername) {
        user.username = nextName;
      }
    }

    if (hasEmail) {
      const nextEmail = String(req.body?.email || "").trim().toLowerCase();

      if (!EMAIL_REGEX.test(nextEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      const existingEmailOwner = await UserModel.findOne({ email: nextEmail }).select("_id");

      if (existingEmailOwner && String(existingEmailOwner._id) !== String(userId)) {
        return res.status(409).json({
          success: false,
          message: "Email is already in use.",
        });
      }

      user.email = nextEmail;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};