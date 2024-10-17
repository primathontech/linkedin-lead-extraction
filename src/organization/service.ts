import SubscriptionModel, { ISubscription } from "../model/subscriptionModels";
import { OrganizationModel, IOrganization } from "../model/organizationModels";

export class OrganizationService {
  static async getOrganization(organizationId: string) {
    try {
      const organization = await OrganizationModel.findById(organizationId);

      return organization;
    } catch (error) {
      console.error("Error in UserService.getUsers:", error.message);
    }
  }

  static async createOrganization(organization: IOrganization) {
    try {
      const { subscriptionId } = organization;
      if (!subscriptionId) {
        return { success: false, message: "Subscription Id Not Found" };
      }
      const subscription = await SubscriptionModel.findById({
        _id: subscriptionId,
      });
      const subscriptionDay = subscription.expireInDay;
      const today = new Date();
      today.setDate(today.getDate() + Number(subscriptionDay));
      const expiryDate = today.toISOString();

      const newOrganization: any = await OrganizationModel.create({
        ...organization,
        subscriptionExpireAt: expiryDate,
      });
      return { success: true, data: newOrganization };
    } catch (error) {
      return { success: false };
    }
  }

  static async updateOrganization(_id: string, body: object) {
    try {
      const updatedOrganization = await OrganizationModel.findByIdAndUpdate(
        _id,
        body,
        { new: true }
      );

      if (updatedOrganization) {
        return { success: true, data: updatedOrganization };
      }
    } catch (error) {
      return { success: false };
    }
  }

  static async createSubscription(body: ISubscription) {
    try {
      const newSubscription = await SubscriptionModel.create(body);
      return newSubscription;
    } catch (error) {
      console.log(error.message);
      return { success: false };
    }
  }

  static async renewSubscription(id: string) {
    try {
      const organization = await OrganizationModel.findById({ _id: id });
      if (!organization) {
        return { success: false, message: "Organization Does Not Exists" };
      }

      const subscriptionId = organization.subscriptionId;

      const subscription = await SubscriptionModel.findById(subscriptionId);

      const subscriptionDay = subscription.expireInDay;
      const today = new Date();
      today.setDate(today.getDate() + Number(subscriptionDay));
      const expiryDate = today.toISOString();

      if (subscriptionId) {
        const updatedSubscription = await OrganizationModel.findByIdAndUpdate(
          { _id: id },
          {
            $set: {
              usedLimit: "0",
              subscriptionExpireAt: expiryDate,
            },
          },
          { new: true }
        );
        if (updatedSubscription) {
          return { success: true, data: updatedSubscription };
        } else {
          return { success: false, data: updatedSubscription };
        }
      } else {
        return {
          success: false,
          message: "Organization Have No Subscription",
          data: null,
        };
      }
    } catch (error) {
      console.log(error.message);
      return { success: false, message: error.message };
    }
  }
}
