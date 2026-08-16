const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["vendor", "hospital", "admin"],
      required: true,
    },
    location: { type: String, required: true },
    contact: { type: String },

    // Vendor-only: reliability tracking, referenced by procurement service
    reliabilityScore: {
      type: Number,
      default: 100, // starts perfect, decays on late/failed shipments
      min: 0,
      max: 100,
    },

    // Geographic coordinates — optional; used by vendor-matching distance calc.
    // Null-safe: haversine helper returns null if either coord is missing.
    latitude: { type: Number },
    longitude: { type: Number },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
