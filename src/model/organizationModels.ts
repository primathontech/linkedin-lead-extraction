import mongoose, { Schema, Document, Mongoose } from "mongoose";

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subscriptionId?: string | any;
  subscriptionExpireAt: Date;
  usedLimit?: string;
  userCount?: string;
  deletedAt?: string;
}

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subscriptionId: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: "SubscriptionModel",
    },
    subscriptionExpireAt: {
      type: Date,
      required: false,
    },
    usedLimit: { type: String, required: false, default: 0 },
    userCount: { type: String, required: true, default: 0 },
    deletedAt: { type: Date, required: false, default: "" },
  },
  { timestamps: true }
);

export const OrganizationModel = mongoose.model<IOrganization>(
  "OrganizationModel",
  OrganizationSchema
);
