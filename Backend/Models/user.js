import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("validate", function setUsername() {
  if (!this.username && this.name) {
    this.username = this.name;
  }
});

// Add indexes for better query performance
// Note: email index is already created via unique: true on the field
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

export const UserModel = model("User", userSchema);