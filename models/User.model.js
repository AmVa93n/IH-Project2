const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },
    birthdate: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
    },
    lang_teach: {
      type: [ String ],
    },
    lang_learn: {
      type: [ String ],
      required: true,
    },
    private: {
      type: Boolean,
    },
    professional: {
      type: Boolean,
    },
    chats: [{ type: Schema.Types.ObjectId, ref: 'Chat' }]
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
