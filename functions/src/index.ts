import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {Readable} from "stream";
import {defineSecret} from "firebase-functions/params";
import {Auth as googleAuth, drive_v3, google, sheets_v4} from 'googleapis';

const GOOGLE_CREDENTIALS_JSON = defineSecret('GOOGLE_CREDENTIALS_JSON');

initializeApp();

// Types for the form request body
interface ParsedBody {
    files: { [key: string]: string };
    fields: { [key: string]: string };
}

// Parse the incoming request body
function parseReq(formData: any, id: string): ParsedBody {
    const parsedBody: ParsedBody = {files: {}, fields: {}};

    Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === "string") {
            if (value.startsWith("data:")) {
                const path = `${id}/${key}`;
                parsedBody.files[path] = value;
                parsedBody.fields[key + "_fileId"] = path;
            } else {
                parsedBody.fields[key] = value;
            }
        }
    });

    return parsedBody;
}

const BUCKET = "files";
const COLLECTION = "data";


// Main Cloud Function: The essential work is done before sending the response.
// The noncritical tasks are kicked off afterward using the fire-and-forget helper.
export const uploadForm = onRequest({
    secrets: [GOOGLE_CREDENTIALS_JSON],
}, async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send(JSON.stringify({error: {message: "Method Not Allowed"}}));
            return;
        }

        const formData = req.body;
        if (!formData || !formData["fiscal-code"]) {
            res.status(400).send(JSON.stringify({error: {message: "Missing required field: fiscal-code"}}));
            return;
        }

        const id = `${formData["fiscal-code"]}_${Date.now()}`;
        const parsedBody = parseReq(formData, id);

        // Process each file: Upload to Firebase Storage.
        for (const [key, value] of Object.entries(parsedBody.files)) {
            const base64Data = value.split(",")[1];
            const mimeType = value.split(";")[0].split(":")[1];
            const buffer = Buffer.from(base64Data, "base64");

            await getStorage()
                .bucket(BUCKET)
                .file(key)
                .save(buffer, {
                    contentType: mimeType, public: true,
                });
        }

        // Save form fields to Firestore.
        await getFirestore().collection(COLLECTION).doc(id).set(parsedBody.fields);

        // Send a response immediately so the user is not delayed.
        res.status(200).send(JSON.stringify({success: true}));

        // copy data on drive
        copyToDrive(parsedBody,)
    } catch (error) {
        console.error("Error in main processing:", error);
        // Even if there is an error in the synchronous part, send a response.
        res.status(500).send(JSON.stringify({error: {message: "Internal Server Error"}}));
    }
});

function copyToDrive(parsedBody: ParsedBody) {
    getAuthClient()
    // Now run background tasks asynchronously:
    // 1. Upload files to Google Drive.
    for (const [key, value] of Object.entries(parsedBody.files)) {
        const base64Data = value.split(",")[1];
        const mimeType = value.split(";")[0].split(":")[1];
        const buffer = Buffer.from(base64Data, "base64");

        // Fire-and-forget with retry.
        fireAndForget(() => uploadToDrive(key.split("/").pop() || key, buffer, mimeType));
    }

    // 2. Append data to a Google Sheet.
    const row = Object.keys(parsedBody.fields).map(fieldKey => parsedBody.fields[fieldKey]);
    fireAndForget(() => appendToSheet(row));

}

let auth: googleAuth.GoogleAuth | null = null;
let drive: drive_v3.Drive | null = null;
let sheets: sheets_v4.Sheets | null = null;


// Lazy getter for the auth client.
function getAuthClient() {
    if (!auth) {
        auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(GOOGLE_CREDENTIALS_JSON.value()),
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
        });
        drive = google.drive({version: "v3", auth});
        sheets = google.sheets({version: "v4", auth});
    }
}


// Set these IDs from your project configurations.
const DRIVE_FOLDER_ID = "1JCbB955kdVMo-rcqpuwCGdSOvhDdO6tt";
const SHEET_ID = "1Rf15O4o3rUJJ-nhpBoKMHN-bNFSfE4el4rBGEt3x6MU";

async function uploadToDrive(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    try {
        // Convert the Buffer into a Readable stream
        const stream = Readable.from(fileBuffer);

        const response = await drive!.files.create({
            requestBody: {
                name: fileName, parents: [DRIVE_FOLDER_ID], mimeType,
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
async function appendToSheet(row: any[]): Promise<void> {
    try {
        const response = await sheets!.spreadsheets.values.append({
            spreadsheetId: SHEET_ID, range: "Sheet1!A1", // Change according to your target range.
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

function fireAndForget(task: () => Promise<void>, retryDelay = 5000, maxRetries = 3, attempt = 1): void {
    task().catch((error) => {
        if (attempt >= maxRetries) {
            console.error("Background task failed after maximum retries:", error);
            return;
        }

        console.error(`Background task failed (attempt ${attempt} of ${maxRetries}), retrying in ${retryDelay}ms`, error);

        setTimeout(() => {
            fireAndForget(task, retryDelay, maxRetries, attempt + 1);
        }, retryDelay);
    });
}