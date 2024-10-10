import { Router } from "express";
import {
  createOrganization,
  createSubscription,
  getOrganization,
  increseLimitSubscription,
  renewSubscription,
  updateOrganization,
} from "./controller";
import { checkSubscriptionAndLimit } from "../middleware/auth.middleware";

const organizationRoutes = Router();

organizationRoutes.get(
  "/organization/:organizationId",
  checkSubscriptionAndLimit,
  getOrganization
);
organizationRoutes.post("/create-organization", createOrganization);
organizationRoutes.put("/update", updateOrganization);
organizationRoutes.post(
  "/create-subscription/:organizationId",
  createSubscription
);
organizationRoutes.put(
  "/renew-subscription/:organizationId",
  renewSubscription
);

organizationRoutes.put(
  "/increase-limit/:organizationId",
  increseLimitSubscription
);

export default organizationRoutes;
