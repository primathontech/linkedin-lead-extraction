import { Request, Response } from "express";
import { LinkedInService } from "./service";

// Helper function to send consistent error responses
const sendErrorResponse = (res: Response, error: any, message: string) => {
  console.error(message, error);
  res.status(500).send({ error: message });
};

// Get Data from LinkedIn
export const getData = async (req: Request, res: Response) => {
  console.log("Inside getData");

  const urn = req.query.urn;
  const organizationId = req.query.organizationId;
  
  if (!urn || !organizationId) {
    return res.status(400).send({ error: "URN is required" });
  }

  try {
    await LinkedInService.extractData(urn as string, organizationId as string);
    res.status(200).send({
      message: "Data successfully received and stored in the database",
    });
  } catch (error) {
    sendErrorResponse(res, error, "Error storing data in the database");
  }
};

// Store Cookies
export const storeCookies = async (req: Request, res: Response) => {
  const { cookies, urn } = req.query;

  if (!cookies || !urn) {
    return res.status(400).send({ error: "Both cookies and URN are required" });
  }

  try {
    await LinkedInService.storeCookies(cookies, urn);
    res.status(200).send({
      message: "Cookie successfully received and stored in the database",
    });
  } catch (error) {
    sendErrorResponse(res, error, "Error storing cookies in the database");
  }
};
