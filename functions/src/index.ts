import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";

// Initialize Firebase app
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
                parsedBody.fields[key] = path;
            } else {
                parsedBody.fields[key] = value;
            }
        }
    });

    return parsedBody;
}

const BUCKET = "data";
const COLLECTION = "files";
export const uploadForm = onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        const formData = req.body;
        if (!formData || !formData['fiscal-code']) {
            res.status(400).send("Missing required field: fiscal-code");
            return
        }

        const id = `${formData['fiscal-code']}_${Date.now()}`; // Get the generated ID
        const parsedBody = parseReq(formData, id);

        // Handle file uploads
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

        // Save form fields to Firestore using the generated ID
        await getFirestore()
            .collection(COLLECTION).doc(id).set(parsedBody.fields);

        res.status(200).send("Upload successful!");
    } catch (error) {
        console.error("Error uploading form:", error);
        res.status(500).send("Internal Server Error");
    }
});
