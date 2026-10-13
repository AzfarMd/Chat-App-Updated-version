const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
//creates names and profile.
const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pic: {
        type: String,
        default:
            "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
}, {
    timestamps: true//created at and updated at time stamps will automatically get created for each user schema.
}
);
// Method to verify passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save middleware to hash passwords before saving
userSchema.pre('save', async function (next) {
    // 1. Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // 2. Hash the new or updated password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;