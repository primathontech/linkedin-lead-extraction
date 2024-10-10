import axios from 'axios'; // Import axios
import {
  convertArrayToCSV,
  decryptValue,
  downloadCsvFile,
  encryptValue,
  extractParameters,
  extractSessionId,
} from '../utills/helper';

import { connectToDatabase } from '../db/connection';

// Define LinkedInData interface
interface LinkedInData {
  paging: {
    total: number;
  };
  elements: any[];
}

export class LinkedInService {
  // Extract data from LinkedIn, download CSV file, and store data in the database
  static async extractData(urn: any) {
    try {
      const db = await connectToDatabase();
      const collection = db.collection('CookiesStoreModel');
      const encryptedCookie = await collection.findOne({ profileUrn: urn });

      if (!encryptedCookie) throw new Error('No cookie found for the given URN');

      const cookie = decryptValue(encryptedCookie['cookie']);

      const queryParams = cookie[14]['value'];
      const headers = {
        'Csrf-Token': cookie[6]['value'],
        Cookie: cookie[17]['value'],
        'X-Restli-Protocol-Version': '2.0.0',
      };

      let resultData: any[] = [];
      const pageSize = 25;

      // Fetch initial data and explicitly cast to LinkedInData type
      const initialData = await this.fetchLinkedInData(queryParams, headers, 0) as { success: boolean; data: LinkedInData };

      if (initialData?.success) {
        const totalCount = initialData.data.paging.total;
        resultData.push(...initialData.data.elements);

        // Determine total pages (limit to 100 pages)
        const totalPages = Math.min(Math.ceil(totalCount / pageSize), 100);

        // Fetch additional paginated data
        await this.fetchPaginatedData(
          queryParams,
          headers,
          totalPages,
          pageSize,
          resultData
        );

        // Convert data to CSV and download
        const csvContent = convertArrayToCSV(resultData);
        downloadCsvFile(csvContent);
        console.log('File created');
      } else {
        throw new Error('Failed to fetch initial data');
      }
    } catch (error) {
      console.error('Error in extractData:', error.message);
    }
  }

  // Fetch paginated LinkedIn data
  private static async fetchPaginatedData(
    queryParams: string,
    headers: any,
    totalPages: number,
    pageSize: number,
    resultData: any[]
  ) {
    for (let i = 1; i < totalPages; i++) {
      const paginatedData = await this.fetchLinkedInData(
        queryParams,
        headers,
        i * pageSize
      ) as { success: boolean; data: LinkedInData };

      if (paginatedData?.success) {
        resultData.push(...paginatedData.data.elements);
      } else {
        break;
      }
    }
  }

  // API call to LinkedIn for fetching leads/records (25 records per request)
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

      // Using axios for HTTP requests
      const response = await axios.get(fetchUrl, { headers });

      if (response.status !== 200) {
        console.error('Failed to fetch data:', response.statusText);
        return { success: false, data: null };
      }

      const data = response.data;
      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchLinkedInData:', error.message);
      return { success: false, data: null };
    }
  }

  // Store cookies in the database (encrypt the cookies)
  static async storeCookies(cookie: any, urn: any) {
    try {
      const encryptedCookie = encryptValue(JSON.stringify(JSON.parse(cookie)));
      const db = await connectToDatabase();
      const collection = db.collection('CookiesStoreModel');

      await collection.updateOne(
        { profileUrn: urn }, // Query to find the document
        { $set: { cookie: encryptedCookie } }, // Update operation
        { upsert: true } // Insert if not found
      );
    } catch (error) {
      console.error('Error in storeCookies:', error.message);
    }
  }
}
