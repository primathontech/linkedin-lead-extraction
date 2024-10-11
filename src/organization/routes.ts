import { Router } from "express";
import {
  createOrganization,
  createSubscription,
  getOrganization,
  renewSubscription,
  updateOrganization,
} from "./controller";

const organizationRoutes = Router();

organizationRoutes.get("/organization/:organizationId", getOrganization);
organizationRoutes.post("/create-organization", createOrganization);
organizationRoutes.put("/update", updateOrganization);
organizationRoutes.post("/create-subscription", createSubscription);
organizationRoutes.put(
  "/renew-subscription/:organizationId",
  renewSubscription
);

export default organizationRoutes;
