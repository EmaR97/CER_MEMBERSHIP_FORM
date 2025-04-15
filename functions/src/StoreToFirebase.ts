import {ParsedBody} from "./ParsedBody";
import {getStorage} from "firebase-admin/storage";
import {getFirestore} from "firebase-admin/firestore";

const BUCKET = "files";
const COLLECTION = "data";

// Main Cloud Function: The essential work is done before sending the response.
export async function storeDataToFirebase(parsedBody: ParsedBody) {
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
    await getFirestore().collection(COLLECTION).doc(parsedBody.fields["_id"]).set(parsedBody.fields);
}