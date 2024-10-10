import SubscriptionModel, { ISubscription } from "../model/subscriptionModels";
import { OrganizationModel, IOrganization } from "../model/organizationModels";

export class OrganizationService {
  static async getOrganization(organizationId: string) {
    try {
      const organization = await OrganizationModel.findById({
        _id: organizationId,
      });
      return organization;
    } catch (error) {
      console.error("Error in UserService.getUsers:", error.message);
    }
  }

  static async createOrganization(organization: IOrganization) {
    try {
      const newOrganization = OrganizationModel.create(organization);
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

  static async createSubscription(id: string, body: ISubscription) {
    try {
      const newSubscription = await SubscriptionModel.create(body);

      if (newSubscription) {
        const organization = await OrganizationModel.findByIdAndUpdate(
          { _id: id },
          { $set: { subscriptionId: newSubscription._id } },
          { new: true }
        );

        if (!organization) {
          return { success: false };
        }
        return {
          success: true,
          data: organization,
          message: "Organization Subscribed Successfully",
        };
      }
      return { success: true, data: newSubscription };
    } catch (error) {
      console.log(error.message);
      return { success: false };
    }
  }

  static async increaseLimitSubscription(id: string, maxLimit: string) {
    try {
      const organization = await OrganizationModel.findById({ _id: id });
      console.log(organization, "checking subscription");
      if (!organization) {
        return { success: false, message: "Organization Does Not Exists" };
      }

      if (organization) {
        const subscription = organization.subscriptionId;
        if (subscription) {
          const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
            { _id: subscription },
            {
              $set: {
                maxLimit: maxLimit,
              },
            },
            { new: true }
          );
          if (updatedSubscription) {
            return updatedSubscription;
          } else {
            return { success: false };
          }
        } else {
          return {
            success: false,
            message: "Organization Have No Subscription",
            data: null,
          };
        }
      } else {
        return {
          success: false,
          message: "Organization Does Not Exist",
          data: null,
        };
      }
    } catch (error) {
      console.log(error.message);
      return { success: false };
    }
  }

  static async renewSubscription(id: string) {
    try {
      const organization = await OrganizationModel.findById({ _id: id });
      console.log(organization, "checking subscription");
      if (!organization) {
        return { success: false, message: "Organization Does Not Exists" };
      }

      if (organization) {
        const subscription = organization.subscriptionId;
        if (subscription) {
          const updatedSubscription = await OrganizationModel.findByIdAndUpdate(
            { _id: id },
            {
              $set: {
                userCount: "0",
              },
            },
            { new: true }
          );
          if (updatedSubscription) {
            console.log(updatedSubscription, "scccccccccccccccccccc");
            return { success: true, data: updatedSubscription };
          } else {
            return { success: false, data: updatedSubscription };
          }
        } else {
          return {
            success: false,
            message: "Organization Have No Subscript",
            data: null,
          };
        }
      } else {
        return {
          success: false,
          message: "Organization Does Not Exists",
          data: null,
        };
      }
    } catch (error) {
      console.log(error.message);
      return { success: false };
    }
  }
}
