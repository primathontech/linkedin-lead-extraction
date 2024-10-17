import SubscriptionModel, { ISubscription } from "../model/subscriptionModels";
import { IOrganization, OrganizationModel } from "../model/organizationModels";
import { OrganizationService } from "./service";
import { Request, Response } from "express";

export const getAllOrganizations = async (req: Request, res: Response) => {
  try {
    const organizations = await OrganizationModel.aggregate([
      {
        $lookup: {
          from: "subscriptionmodels",
          localField: "subscriptionId",
          foreignField: "_id",
          as: "subscription",
        },
      },
      {
        $unwind: {
          path: "$subscription",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    if (!organizations) {
      return res.status(200).json({
        success: true,
        message: "Organizations Not found",
        data: [],
      });
    }
    return res.status(200).json({
      success: true,
      message: "Organizations fetched successfully",
      data: organizations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while fetching organizations",
    });
  }
};

export const getOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const organization = await OrganizationService.getOrganization(
      organizationId
    );
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization Not Find Successfully",
        data: organization,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Organization Find Successfully",
      data: organization,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while fetching organization",
    });
  }
};

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const newOrganizationBody: IOrganization = req.body;

    const existingOrganization: any = await OrganizationModel.findOne({
      email: email,
    });

    if (existingOrganization) {
      return res.status(400).json({
        success: false,
        message: "Organization Alreay exists",
        data: existingOrganization,
      });
    }

    const newOrganization = await OrganizationService.createOrganization(
      newOrganizationBody
    );

    if (!newOrganization) {
      return res.status(400).json({
        success: false,
        message: "Organization not created",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Organization Created Successfully",
      data: newOrganization.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while creating organization",
    });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const updatedOrganizationBody: any = req.body;

    const updatedOrganization = await OrganizationService.updateOrganization(
      organizationId,
      updatedOrganizationBody
    );

    if (!updatedOrganization) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organization Updated Successfully",
      data: updatedOrganization,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while updating organization",
    });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const newSubscriptionBody: ISubscription = req.body;

    console.log(newSubscriptionBody, "body");

    const newSubscription = await OrganizationService.createSubscription(
      newSubscriptionBody
    );

    if (!newSubscription) {
      return res.status(404).json({
        success: false,
        message: "Subs",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Subscription Created Successfully",
      data: newSubscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while creating subscription",
    });
  }
};

export const renewSubscription = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization Id is required",
      });
    }

    const renewedSubscription = await OrganizationService.renewSubscription(
      organizationId
    );

    if (!renewedSubscription) {
      return res.status(404).json({
        success: false,
        message: "Renewal subscription failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription renew Successfully",
      data: renewedSubscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while renewing subscription",
    });
  }
};
