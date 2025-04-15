import {Readable} from "stream";
import {Auth, drive_v3, google, sheets_v4} from "googleapis";
import {ParsedBody} from "./ParsedBody";
import {Logger} from "./Logger";

export class GoogleApiService {
  private readonly driveFolderId: string;
  private readonly sheetId: string;
  private authClient: Auth.GoogleAuth | null = null;
  private driveService: drive_v3.Drive | null = null;
  private sheetsService: sheets_v4.Sheets | null = null;

  constructor(driveFolderId: string, sheetId: string) {
    this.driveFolderId = driveFolderId;
    this.sheetId = sheetId;
    Logger.debug(`GoogleApiService initialized with folderId=${driveFolderId}, sheetId=${sheetId}`);
  }

  public async uploadData(parsedBody: ParsedBody, credentials: any): Promise<void> {
    Logger.info("Starting uploadData process.");
    this.initialize(credentials);

    const subfolderName = parsedBody.fields["_id"];
    if (!subfolderName) {
      Logger.warn("Missing '_id' field in parsed body. Subfolder name will be undefined.");
    } else {
      Logger.debug(`Subfolder name resolved to: ${subfolderName}`);
    }

    Logger.debug("Creating subfolder...");
    const subfolderId = await this.createSubfolder(subfolderName);

    if (!parsedBody.files?.length) {
      Logger.warn("No files found to upload.");
    }

    Logger.info(`Uploading ${parsedBody.files.length} files...`);
    await Promise.all(parsedBody.files.map(async (file) => {
      const {fileName, buffer, mimeType} = file;
      Logger.debug(`Preparing to upload file: ${fileName} (${buffer.length} bytes, ${mimeType})`);
      const fileId = await this.uploadFile(fileName, buffer, mimeType, subfolderId);
      parsedBody.fields[`${fileName}_fileId`] = `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
      Logger.debug(`File uploaded and linked: ${fileName} -> ${fileId}`);
    }));

    await this.appendRowToSheet(parsedBody.fields);

    Logger.info("uploadData process completed.");
  }

  private initialize(credentials: any): void {
    if (!this.authClient) {
      Logger.debug("Initializing Google API clients...");
      this.authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/spreadsheets"],
      });
      this.driveService = google.drive({version: "v3", auth: this.authClient});
      this.sheetsService = google.sheets({version: "v4", auth: this.authClient});
      Logger.debug("Google API clients initialized.");
    } else {
      Logger.debug("Google API clients already initialized. Skipping.");
    }
  }

  private async createSubfolder(folderName: string): Promise<string> {
    try {
      Logger.debug(`Creating Drive subfolder: ${folderName}`);
      const res = await this.driveService!.files.create({
        requestBody: {
          name: folderName, mimeType: "application/vnd.google-apps.folder", parents: [this.driveFolderId],
        },
      });
      Logger.info("Created subfolder", res.data.id);
      return res.data.id!;
    } catch (error: any) {
      Logger.error("Subfolder creation error:", error.response?.data || error);
      throw error;
    }
  }

  private async uploadFile(fileName: string, fileBuffer: Buffer, mimeType: string, folderId: string): Promise<string> {
    try {
      Logger.debug(`Uploading file: ${fileName}, mimeType=${mimeType}, size=${fileBuffer.length} bytes`);
      const stream = Readable.from(fileBuffer);
      const response = await this.driveService!.files.create({
        requestBody: {
          name: fileName, mimeType, parents: [folderId],
        }, media: {mimeType, body: stream}, fields: "id",
      });
      Logger.info(`Uploaded file '${fileName}' to Drive with ID: ${response.data.id}`);
      return response.data.id!;
    } catch (error: any) {
      Logger.error(`File upload error for '${fileName}':`, error.response?.data || error);
      throw error;
    }
  }

  private async appendRowToSheet(fields: { [key: string]: string }): Promise<void> {
    try {
      const headers = Object.keys(fields);
      const row = headers.map((key) => fields[key]);

      // Step 1: Get existing first row (potential header)
      const getResponse = await this.sheetsService!.spreadsheets.values.get({
        spreadsheetId: this.sheetId, range: "Sheet1!1:1",
      });

      const existingHeader = getResponse.data.values?.[0];

      // Step 2: If no header or header mismatch, prepend header
      if (!existingHeader || headers.join() !== existingHeader.join()) {
        Logger.debug("Header row missing or mismatched. Adding headers:", headers);
        await this.sheetsService!.spreadsheets.values.update({
          spreadsheetId: this.sheetId,
          range: "Sheet1!A1",
          valueInputOption: "RAW",
          requestBody: {values: [headers]},
        });
      }

      // Step 3: Append row
      Logger.debug("Appending row to sheet:", row);
      const appendResponse = await this.sheetsService!.spreadsheets.values.append({
        spreadsheetId: this.sheetId, range: "Sheet1!A2", // Start from A2 to avoid overwriting header
        valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: {values: [row]},
      });

      Logger.info("Data appended to sheet successfully", appendResponse.data.updates);
    } catch (error: any) {
      Logger.error("Sheet append error:", error.response?.data || error);
      throw error;
    }
  }
}
