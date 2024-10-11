import crypto from "crypto";
import fs from "fs";
import fastcsv from "fast-csv";
import { Buffer } from "node:buffer";
import { Parser } from "json2csv"; // Import the json2csv library

// Define encryption key
const key = "my32bytepassword1234567890123456";

// Helper: Convert months to years and months format
export const convertMonthsToYearsMonths = (months: number): string => {
  if (!months) return "";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} years, ${remainingMonths} months`;
};

// Helper: Extract profile and company details for CSV
const extractDetailsForCSV = (item: any) => {
  const currentPosition = item.currentPositions[0] || {};
  const companyDetails = currentPosition.companyUrnResolutionResult || {};

  const profileIdMatch = item.entityUrn.match(/fs_salesProfile:\(([^,]+)/);
  const profileId = profileIdMatch ? profileIdMatch[1] : "";
  const profileUrl = profileId
    ? `https://www.linkedin.com/in/${profileId}`
    : "";

  const companyIdMatch = currentPosition?.companyUrn?.match(
    /fs_salesCompany:(\d+)/
  );
  const companyId = companyIdMatch ? companyIdMatch[1] : "";
  const companyUrl = companyId
    ? `https://www.linkedin.com/company/${companyId}`
    : "";

  return {
    firstName: item.firstName,
    lastName: item.lastName,
    fullName: item.fullName,
    geoRegion: item.geoRegion,
    currentPosition: currentPosition.title || "",
    companyName: currentPosition.companyName || "",
    tenureAtCompany: convertMonthsToYearsMonths(
      currentPosition.tenureAtCompany?.numMonths || 0
    ),
    startedOn: currentPosition.startedOn
      ? `${currentPosition.startedOn.month}/${currentPosition.startedOn.year}`
      : "",
    title: currentPosition.title || "",
    tenureAtPosition: convertMonthsToYearsMonths(
      currentPosition.tenureAtPosition?.numMonths || 0
    ),
    companyIndustry: companyDetails.industry || "",
    companyLocation: companyDetails.location || "",
    companyUrl,
    profileUrl,
  };
};

// Convert array of objects to CSV format
export const convertArrayToCSV = (data: any[]) => {
  const headers = [
    "firstName",
    "lastName",
    "fullName",
    "geoRegion",
    "currentPosition",
    "companyName",
    "tenureAtCompany",
    "startedOn",
    "title",
    "tenureAtPosition",
    "companyIndustry",
    "companyLocation",
    "companyUrl",
    "profileUrl",
  ];

  const rows = data.map(extractDetailsForCSV);
  return rows;
};

// Function to create a CSV file and handle download
export const downloadCsvFile = (
  data: any[],
  fileName = `lead-data-${Date.now()}.csv`
) => {
  try {
    const headers = [
      "firstName",
      "lastName",
      "fullName",
      "geoRegion",
      "currentPosition",
      "companyName",
      "tenureAtCompany",
      "startedOn",
      "title",
      "tenureAtPosition",
      "companyIndustry",
      "companyLocation",
      "companyUrl",
      "profileUrl",
    ];

    // Sanitize data to handle undefined or missing fields
    const sanitizedData = data.map((item) => ({
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      fullName: item.fullName || "",
      geoRegion: item.geoRegion || "",
      currentPosition: item.currentPosition || "",
      companyName: item.companyName || "",
      tenureAtCompany: item.tenureAtCompany || "",
      startedOn: item.startedOn || "",
      title: item.title || "",
      tenureAtPosition: item.tenureAtPosition || "",
      companyIndustry: item.companyIndustry || "",
      companyLocation: item.companyLocation || "",
      companyUrl: item.companyUrl || "",
      profileUrl: item.profileUrl || "",
    }));

    // Create a parser object with the headers
    const json2csvParser = new Parser({ fields: headers });

    // Convert JSON data to CSV
    const csv = json2csvParser.parse(sanitizedData);
    // Write the CSV string to a file
    // fs.writeFileSync(fileName, csv, "utf8");
    return csv;
  } catch (error) {
    console.error("Error creating CSV file:", error);
  }
};

// Extract query parameters and build LinkedIn API URL
export const extractParameters = ({
  url,
  sessionId,
  start,
}: {
  url: string;
  sessionId: string;
  start: number;
}) => {
  const queryParams = new URL(url).searchParams;
  const savedSearchId = queryParams.get("savedSearchId");
  const recentSearchId = queryParams.get("recentSearchId");

  // if (!savedSearchId || !sessionId) {
  //   throw new Error("Missing savedSearchId or sessionId");
  // }

  return recentSearchId
    ? `https://www.linkedin.com/sales-api/salesApiLeadSearch?q=recentSearchId&start=${start}&count=25&recentSearchId=${recentSearchId}&trackingParam=(sessionId:${sessionId})&decorationId=com.linkedin.sales.deco.desktop.searchv2.LeadSearchResult-14`
    : `https://www.linkedin.com/sales-api/salesApiLeadSearch?q=savedSearchId&start=${start}&count=25&savedSearchId=${savedSearchId}&trackingParam=(sessionId:${sessionId})&decorationId=com.linkedin.sales.deco.desktop.searchv2.LeadSearchResult-14`;
};

// Extract session ID from URL
export const extractSessionId = (url: string): string | null => {
  const match = url.match(/[?&]sessionId=([^&]+)/);
  return match ? match[1] : null;
};

// Encrypt a value using AES-256-ECB (no IV)
export const encryptValue = (value: string): string => {
  try {
    const cipher = crypto.createCipheriv("aes-256-ecb", Buffer.from(key), null);
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (error) {
    console.error("Error encrypting value:", error);
    throw new Error("Encryption failed");
  }
};

// Decrypt a value using AES-256-ECB (no IV)
export const decryptValue = (encrypted: string): any => {
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-ecb",
      Buffer.from(key),
      null
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Error decrypting value:", error);
    throw new Error("Decryption failed");
  }
};

// Convert data array for Company Search to CSV format
export const convertArrayToCSVCompanySearch = (data: any[]) => {
  return data.map((item) => ({
    companyName: item.companyName || "",
    companyIndustry: item.industry || "",
    companyUrl: item.entityUrn
      ? `https://www.linkedin.com/sales/company/${item.entityUrn
          .split(":")
          .pop()}`
      : "",
  }));
};

// Download CSV file for Company Search
export const downloadCsvFileCompanySearch = (
  data: any[],
  fileName = `company-data-${Date.now()}.csv`
) => {
  try {
    const ws = fs.createWriteStream(fileName);
    const headers = ["companyName", "companyIndustry", "companyUrl"];

    fastcsv
      .write(data, { headers, writeHeaders: true, quoteColumns: true })
      .on("finish", () => console.log("Company CSV file created successfully"))
      .pipe(ws);
  } catch (error) {
    console.error("Error creating Company CSV file:", error);
  }
};

export function findCookieValue(cookieArray, name) {
  const cookieObject = cookieArray.find(cookie => new RegExp(`^${name}$`).test(cookie.name));
  return cookieObject ? cookieObject.value : null;
}
