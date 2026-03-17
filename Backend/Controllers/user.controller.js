import { UserModel } from "../Models/user.js";

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