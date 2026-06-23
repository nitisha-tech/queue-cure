// backend/models/QueueState.js
const mongoose = require("mongoose");

const queueStateSchema = new mongoose.Schema(
  {
    currentToken: {
      type: Number,
      default: null,
    },
    lastTokenNumber: {
      type: Number,
      default: 0,
    },
    avgConsultTime: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

queueStateSchema.statics.getInstance = async function () {
  let state = await this.findOne();
  if (!state) {
    state = await this.create({});
  }
  return state;
};

module.exports = mongoose.model("QueueState", queueStateSchema);