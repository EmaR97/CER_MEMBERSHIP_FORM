import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import * as express from "express";

// Initialize Firebase app
initializeApp();

// Types for the form request body
interface ParsedBody {
    files: { [key: string]: string };
    fields: { [key: string]: string };
}

// Parse the incoming request body
function parseReq(req: express.Request): ParsedBody {
    const formData = req.body;
    const parsedBody: ParsedBody = {files: {}, fields: {}};

    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === "string" && value.startsWith("data:")) {
            parsedBody.files[key] = value;
        } else {
            if (typeof value === "string") {
                parsedBody.fields[key] = value;
            }
        }
    }

    return parsedBody;
}

export const uploadForm = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
    }

    const parsedBody = parseReq(req);

    // Handle file uploads
    for (const [key, value] of Object.entries(parsedBody.files)) {
        const base64Data = value.split(",")[1];
        const mimeType = value.split(";")[0].split(":")[1];
        const buffer = Buffer.from(base64Data, "base64");

        await getStorage()
            .bucket("documenti")
            .file(key)
            .save(buffer, {
                contentType: mimeType, public: true,
            });
    }

    // Save form fields to Firestore
    await getFirestore()
        .collection("messages")
        .add({original: parsedBody.fields});
    res.status(200).send("Upload successful!");
});
