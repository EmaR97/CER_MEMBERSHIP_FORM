import {Readable} from "stream";
import {Auth as googleAuth, drive_v3, google, sheets_v4} from "googleapis";
import {ParsedBody} from "./ParsedBody";


export class GoogleAPIService {
    private readonly driveFolderId: string;
    private readonly sheetId: string;
    private auth: googleAuth.GoogleAuth | null = null;
    private drive: drive_v3.Drive | null = null;
    private sheets: sheets_v4.Sheets | null = null;

    constructor(driveFolderId: string, sheetId: string) {
        this.driveFolderId = driveFolderId;
        this.sheetId = sheetId;
    }

// Lazy getter for the auth client.
    private initialize(credentials: any) {
        if (!this.auth) {
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
            });
            this.drive = google.drive({version: "v3", auth: this.auth});
            this.sheets = google.sheets({version: "v4", auth: this.auth});
        }
    }

// Set these IDs from your project configurations.

    public async storeDataToDrive(parsedBody: ParsedBody, credentials: string) {
        this.initialize(credentials);

        const fileKeys = Object.keys(parsedBody.files);
        const sharedPrefix = fileKeys[0].split("/")[0];

        const subfolderId = await this.createDriveSubfolder(sharedPrefix);

        for (const [key, value] of Object.entries(parsedBody.files)) {
            const base64Data = value.split(",")[1];
            const mimeType = value.split(";")[0].split(":")[1];
            const buffer = Buffer.from(base64Data, "base64");

            const fileName = key.split("/").pop() || key;
            const fileId = await this.uploadFileToDrive(fileName, buffer, mimeType, subfolderId);

            // 👇 Save a shareable link (or just the file ID) to the fields
            parsedBody.fields[`${fileName}_fileLink`] = `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
        }

        const row = Object.keys(parsedBody.fields).map(fieldKey => parsedBody.fields[fieldKey]);
        await this.appendToSheet(row);
    }


    private async createDriveSubfolder(folderName: string): Promise<string> {
        try {
            const res = await this.drive!.files.create({
                requestBody: {
                    name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [this.driveFolderId],
                },
            });
            console.log("Created subfolder with ID:", res.data.id);
            return res.data.id!;
        } catch (error: any) {
            console.error("Error creating subfolder:", error.response?.data || error);
            throw error;
        }
    }

    private async uploadFileToDrive(fileName: string, fileBuffer: Buffer, mimeType: string, folderId: string): Promise<string> {
        try {
            const stream = Readable.from(fileBuffer);
            const response = await this.drive!.files.create({
                requestBody: {
                    name: fileName, parents: [folderId], mimeType,
                }, media: {
                    mimeType, body: stream,
                }, fields: 'id', // Return only the file ID
            });
            const fileId = response.data.id!;
            console.log("Uploaded file to Drive with id:", fileId);
            return fileId;
        } catch (error: any) {
            console.error("Drive API error details:", error.response?.data || error);
            throw error;
        }
    }


// Helper function to append data to a Google Sheet.
    private async appendToSheet(row: any[]): Promise<void> {
        try {
            const response = await this.sheets!.spreadsheets.values.append({
                spreadsheetId: this.sheetId, range: "Sheet1!A1", // Change according to your target range.
                valueInputOption: "RAW", requestBody: {
                    values: [row],
                },
            });
            console.log("Appended data to sheet:", response.data.updates);
        } catch (error) {
            console.error("Error appending data to sheet:", error);
            throw error;
        }
    }

}