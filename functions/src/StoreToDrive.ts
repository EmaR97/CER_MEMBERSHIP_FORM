import {Readable} from "stream";
import {Auth as googleAuth, drive_v3, google, sheets_v4} from "googleapis";
import {ParsedBody} from "./ParsedBody";
import {fireAndForget} from "./utility";


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


    public storeDataToDrive(parsedBody: ParsedBody, credentials: string) {
        this.initialize(credentials)
        // Now run background tasks asynchronously:
        // 1. Upload files to Google Drive.
        for (const [key, value] of Object.entries(parsedBody.files)) {
            const base64Data = value.split(",")[1];
            const mimeType = value.split(";")[0].split(":")[1];
            const buffer = Buffer.from(base64Data, "base64");

            // Fire-and-forget with retry.
            fireAndForget(() => this.uploadFileToDrive(key.split("/").pop() || key, buffer, mimeType));
        }

        // 2. Append data to a Google Sheet.
        const row = Object.keys(parsedBody.fields).map(fieldKey => parsedBody.fields[fieldKey]);
        fireAndForget(() => this.appendToSheet(row));

    }

    private async uploadFileToDrive(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
        try {
            // Convert the Buffer into a Readable stream
            const stream = Readable.from(fileBuffer);

            const response = await this.drive!.files.create({
                requestBody: {
                    name: fileName, parents: [this.driveFolderId], mimeType,
                }, media: {
                    mimeType, body: stream,
                },
            });
            console.log("Uploaded file to Drive with id:", response.data.id);
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