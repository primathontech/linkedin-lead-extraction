import { Request, Response, NextFunction } from "express";
import { OrganizationService } from "../organization/service";
import SubscriptionModel from "../model/subscriptionModels";

export const checkSubscriptionAndLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId: any = req.headers.organizationid;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const organization = await OrganizationService.getOrganization(
      organizationId
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const subscriptionId = organization.subscriptionId;

    if (!subscriptionId) {
      return res.status(404).json({
        success: false,
        message: "Organization does not have a subscription",
      });
    }

    const subscription = await SubscriptionModel.findById({
      _id: subscriptionId,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found for this organization",
      });
    }
    // Check if the subscription has expired
    const currentDate = new Date();
    const subscriptionExpireAt = new Date(organization.subscriptionExpireAt);

    if (subscriptionExpireAt < currentDate) {
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired",
      });
    }

    if (Number(organization.usedLimit) >= Number(subscription.maxLimit)) {
      return res.status(403).json({
        success: false,
        message: "Download Lead reached the limit for this subscription",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
