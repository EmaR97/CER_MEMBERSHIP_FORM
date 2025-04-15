import {ParsedBody} from "./ParsedBody";
import {getStorage} from "firebase-admin/storage";
import {getFirestore} from "firebase-admin/firestore";

const BUCKET = "files";
const COLLECTION = "data";

export async function storeDataToFirebase(parsedBody: ParsedBody) {
    // Prepare file upload promises
    const uploadPromises = parsedBody.files.map((file) => {
        const {mimeType, buffer, folderPath, fileName} = file;
        const fullPath = `${folderPath}/${fileName}`;

        return getStorage()
            .bucket(BUCKET)
            .file(fullPath)
            .save(buffer, {
                contentType: mimeType, public: true,
            });
    });

    // Firestore write promise
    const firestorePromise = getFirestore()
        .collection(COLLECTION)
        .doc(parsedBody.fields["_id"])
        .set(parsedBody.fields);

    // Run everything in parallel
    await Promise.all([...uploadPromises, firestorePromise]);
}

