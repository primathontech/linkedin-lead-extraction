import { OrganizationModel, IOrganization } from "../model/organizationModels";
import SubscriptionModel, { ISubscription } from "../model/subscriptionModels";
import CookiesStoreModel from "../model/cookies";
import axios from "axios";
import {
  convertArrayToCSV,
  decryptValue,
  downloadCsvFile,
  encryptValue,
  extractParameters,
  extractSessionId,
  findCookieValue,
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
      const csrfToken = findCookieValue(cookie, "Csrf-Token");
      const queryParams = findCookieValue(cookie, "Referer");
      const cookieValue = findCookieValue(cookie, "Cookie");

      console.log(cookie, "cookie");

      const headers = {
        "Csrf-Token": csrfToken,
        Cookie: cookieValue,
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
        console.log(
          resultData,
          "resultData",
          "and",
          "result data length",
          resultData.length
        );
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
        // downloadCsvFile(csvContent);
        console.log(`File created with ${resultData.length} entries`);

        console.log(csvContent, "csv content");

        let message = "";
        if (totalAvailable > downloadLimit) {
          // message = "Limit exceeded. Some data could not be downloaded.";
          message = "Data Downloaded Successfully";
        } else if (newUsedLimit >= maxLimit) {
          message =
            "You have reached your subscription limit. No more data can be downloaded.";
        } else {
          message = `Data Downloaded Successfully`;
          // message = `You can still download ${
          //   maxLimit - newUsedLimit
          // } more entries.`;
        }

        return {
          downloadedCount: resultData.length,
          remainingCount: maxLimit - newUsedLimit,
          message: message,
          csvContent: csvContent,
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
    try {
      const fetchUrl = extractParameters({
        url,
        sessionId: extractSessionId(url),
        start,
      });

      console.log(url, "url");
      console.log(start, "start");
      console.log(fetchUrl, "fetchUrl");
      console.log(headers, "headers");
      const response = await axios.get(fetchUrl, { headers });

      console.log(response, "get response");

      if (response.status !== 200) {
        return { success: false, data: null };
      }

      const data = await response.data;
      console.log(data, "=========data=====================");
      return { success: true, data };
    } catch (error) {
      console.error("Error in fetchLinkedInData:", error);
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
