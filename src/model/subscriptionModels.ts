import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  maxAllowedUser: string;
  maxLimit: string;
  expireAt: Date;
  deletedAt?: string;
}

const SubscriptionSchema = new Schema(
  {
    maxAllowedUser: { type: String, required: true, default: 5 },
    maxLimit: { type: String, required: true, default: 100 },
    expireAt: {
      type: Date,
      required: true,
    },
    deletedAt: { type: Date, required: false, default: "" },
  },
  { timestamps: true }
);

const SubscriptionModel = mongoose.model<ISubscription>(
  "SubscriptionModel",
  SubscriptionSchema
);

export default SubscriptionModel;
