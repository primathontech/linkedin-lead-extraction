import { Request, Response } from "express";
import { LinkedInService } from "./service";
import { downloadCsvFile, formatDate } from "../utills/helper";
import fs from "fs";

// Helper function to send consistent error responses
const sendErrorResponse = (res: Response, error: any, message: string) => {
  console.error(message, error);
  res.status(500).send({ error: message });
};

// Get Data from LinkedIn
// export const getData = async (req: Request, res: Response) => {

//   const urn = req.query.urn;
//   const organizationId = req.query.organizationId;

//   if (!urn || !organizationId) {
//     return res.status(400).send({ error: "URN is required" });
//   }

//   try {
//     const response = await LinkedInService.extractData(
//       urn as string,
//       organizationId as string
//     );

//     console.log(response,"api response");
//     console.log(response.csvContent,"api csv content");

//     return res.status(200).send({
//       message: `${response.message}`,
//       limit: "limit",
//       csvContent: downloadCsvFile(response.csvContent),
//     });
//   } catch (error) {
//     sendErrorResponse(res, error, "Error storing data in the database");
//   }
// };

export const getData = async (req: Request, res: Response) => {
  const urn = req.query.urn as string;
  const organizationId = req.query.organizationId as string;
  const savedSearchId = req.query.savedSearchId as string;
  
  if (!urn || !organizationId) {
    return res
      .status(400)
      .send({ error: "URN and organizationId are required" });
  }
  console.log(urn, organizationId);

  try {
    const response = await LinkedInService.extractData(urn, organizationId);
    console.log(response, "api response");

    const currentDateTime = formatDate(new Date());
    const fileName = savedSearchId
      ? `lead-data-${savedSearchId}-${Date.now()}.csv`
      : `lead-data-${currentDateTime}.csv`;
    const filePath = `./${fileName}`; 

    // Create the CSV file
    downloadCsvFile(response.csvContent, filePath);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Delete the file after sending
    fileStream.on("close", () => {
      fs.unlinkSync(filePath);
    });

    // Log success message
    console.log(`File ${fileName} sent successfully`);
  } catch (error) {
    sendErrorResponse(res, error, "Error processing data");
  }
};


// Store Cookies
export const storeCookies = async (req: Request, res: Response) => {
  try {
    const { cookies, urn } = req.query;

    if (!cookies || !urn) {
      return res
        .status(400)
        .send({ error: "Both cookies and URN are required" });
    }

    await LinkedInService.storeCookies(cookies, urn);
    res.status(200).send({
      message: "Cookie successfully received and stored in the database",
    });
  } catch (error) {
    sendErrorResponse(res, error, "Error storing cookies in the database");
  }
};
