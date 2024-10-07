import {
  convertArrayToCSV,
  decryptValue,
  downloadCsvFile,
  encryptValue,
  extractParameters,
  extractSessionId,
} from '../utills/helper';

import { connectToDatabase } from '../db/connection';

export class LinkedInService {
  // Extract data from LinkedIn, download CSV file, and store data in the database
  static async extractData(urn: any) {
    try {
      const db = await connectToDatabase();
      const collection = db.collection('CookiesStoreModel');
      const encryptedCookie = await collection.findOne({ profileUrn: urn });

      if (!encryptedCookie)
        throw new Error('No cookie found for the given URN');

      const cookie = decryptValue(encryptedCookie['cookie']);
      const queryParams = cookie[15]['value'];
      const headers = {
        'Csrf-Token': cookie[6]['value'],
        Cookie: cookie[18]['value'],
        'X-Restli-Protocol-Version': '2.0.0',
      };

      let resultData: any[] = [];
      const pageSize = 25;

      // Fetch initial data
      const initialData = await this.fetchLinkedInData(queryParams, headers, 0);

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
      );
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
      const response = await fetch(fetchUrl, { method: 'GET', headers });

      if (!response.ok) {
        console.error('Failed to fetch data:', response.statusText);
        return { success: false, data: null };
      }

      const data = await response.json();
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
