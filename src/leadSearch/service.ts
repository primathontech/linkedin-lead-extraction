import { OrganizationModel, IOrganization } from "../model/organizationModels";
import SubscriptionModel, { ISubscription } from "../model/subscriptionModels";
import CookiesStoreModel from "../model/cookies";
import {
  convertArrayToCSV,
  decryptValue,
  downloadCsvFile,
  encryptValue,
  extractParameters,
  extractSessionId,
} from "../utills/helper";

export class LinkedInService {
  static async extractData(urn: string, organizationId: string) {
    try {
      const organization = await OrganizationModel.findById(
        organizationId
      ).populate("subscriptionId");
      if (!organization) {
        throw new Error("Organization not found");
      }

      const subscription = organization.subscriptionId as ISubscription;
      if (!subscription) {
        throw new Error("No subscription found for the organization");
      }

      const maxLimit = parseInt(subscription.maxLimit);
      const usedLimit = parseInt(organization.usedLimit || "0");
      const remainingLimit = maxLimit - usedLimit;

      if (remainingLimit <= 0) {
        throw new Error(
          "Subscription limit exceeded. You cannot download any more data."
        );
      }

      const encryptedCookie = await CookiesStoreModel.findOne({
        profileUrn: urn,
      });
      if (!encryptedCookie) {
        throw new Error("No cookie found for the given URN");
      }

      const cookie = decryptValue(encryptedCookie.cookie);
      const queryParams = cookie[14 | 15].value;

      const headers = {
        "Csrf-Token": cookie[4].value,
        Cookie: cookie[cookie.length - 1].value,
        "X-Restli-Protocol-Version": "2.0.0",
      };

      let resultData: any[] = [];
      const pageSize = 25;

      // Fetch initial data
      const initialData = await this.fetchLinkedInData(queryParams, headers, 0);

      if (initialData?.success) {
        const totalAvailable = initialData.data.paging.total;
        const downloadLimit = Math.min(totalAvailable, remainingLimit);

        resultData.push(...initialData.data.elements.slice(0, downloadLimit));

        // Determine total pages
        const totalPages = Math.ceil(downloadLimit / pageSize);

        // Fetch additional paginated data
        await this.fetchPaginatedData(
          queryParams,
          headers,
          totalPages,
          pageSize,
          resultData,
          downloadLimit
        );

        // Update organization usage
        const newUsedLimit = usedLimit + resultData.length;
        await OrganizationModel.findByIdAndUpdate(
          organizationId,
          { usedLimit: newUsedLimit.toString() },
          { new: true }
        );

        // Convert data to CSV and download
        const csvContent: any = convertArrayToCSV(resultData);
        downloadCsvFile(csvContent);
        console.log(`File created with ${resultData.length} entries`);

        let message = "";
        if (totalAvailable > downloadLimit) {
          message = "Limit exceeded. Some data could not be downloaded.";
        } else if (newUsedLimit >= maxLimit) {
          message =
            "You have reached your subscription limit. No more data can be downloaded.";
        } else {
          message = `You can still download ${
            maxLimit - newUsedLimit
          } more entries.`;
        }

        return {
          downloadedCount: resultData.length,
          remainingCount: maxLimit - newUsedLimit,
          message: message,
        };
      } else {
        throw new Error("Failed to fetch initial data");
      }
    } catch (error) {
      console.error("Error in extractData:", error.message);
      throw error;
    }
  }

  private static async fetchPaginatedData(
    queryParams: string,
    headers: any,
    totalPages: number,
    pageSize: number,
    resultData: any[],
    downloadLimit: number
  ) {
    for (let i = 1; i < totalPages; i++) {
      if (resultData.length >= downloadLimit) break;

      const paginatedData = await this.fetchLinkedInData(
        queryParams,
        headers,
        i * pageSize
      );
      if (paginatedData?.success) {
        const remainingSlots = downloadLimit - resultData.length;
        resultData.push(
          ...paginatedData.data.elements.slice(0, remainingSlots)
        );
      } else {
        break;
      }
    }
  }

  private static async fetchLinkedInData(
    url: string,
    headers: any,
    start: number
  ) {
    console.log(url, "url");
    console.log(headers, "headers");

    try {
      const fetchUrl = extractParameters({
        url,
        sessionId: extractSessionId(url),
        start,
      });

      console.log(url, "url");
      console.log(extractSessionId(url), "session id");
      console.log(start, "start");

      const response = await fetch(fetchUrl, { method: "GET", headers });

      if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        return { success: false, data: null };
      }

      const data = await response.json();

      return { success: true, data };
    } catch (error) {
      console.error("Error in fetchLinkedInData:", error.message);
      return { success: false, data: null };
    }
  }

  // Store cookies in the database (encrypt the cookies)
  static async storeCookies(cookie: any, urn: any) {
    try {
      const encryptedCookie = encryptValue(JSON.stringify(JSON.parse(cookie)));
      
      await CookiesStoreModel.updateOne(
        { profileUrn: urn }, // Query to find the document
        { $set: { cookie: encryptedCookie } }, // Update operation
        { upsert: true } // Insert if not found
      );
    } catch (error) {
      console.error("Error in storeCookies:", error.message);
    }
  }
}
