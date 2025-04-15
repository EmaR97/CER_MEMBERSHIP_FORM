import {ParsedBody} from "./ParsedBody";
import {getStorage} from "firebase-admin/storage";
import {getFirestore} from "firebase-admin/firestore";
import {Logger} from "./Logger"; // Make sure Logger.ts is in the same directory or update the path

const BUCKET = "files";
const COLLECTION = "data";

export async function storeDataToFirebase(parsedBody: ParsedBody) {
  Logger.info("Storing data to Firebase started.");

  try {
    // Prepare file upload promises
    const uploadPromises = parsedBody.files.map((file, index) => {
      const {mimeType, buffer, folderPath, fileName} = file;
      const fullPath = `${folderPath}/${fileName}`;

      Logger.debug(`Preparing upload [${index}]:`, {fullPath, mimeType});

      return getStorage()
          .bucket(BUCKET)
          .file(fullPath)
          .save(buffer, {
            contentType: mimeType, public: true,
          })
          .then(() => Logger.info(`Uploaded file: ${fullPath}`))
          .catch((err) => {
            Logger.error(`Failed to upload file: ${fullPath}`, err);
            throw err;
          });
    });

    // Firestore write promise
    const docId = parsedBody.fields["_id"];
    Logger.debug("Preparing Firestore write for document ID:", docId);

    const firestorePromise = getFirestore()
        .collection(COLLECTION)
        .doc(docId)
        .set(parsedBody.fields)
        .then(() => Logger.info(`Saved Firestore document: ${docId}`))
        .catch((err) => {
          Logger.error(`Failed to save Firestore document: ${docId}`, err);
          throw err;
        });

    // Run everything in parallel
    await Promise.all([...uploadPromises, firestorePromise]);

    Logger.info("All uploads and Firestore write completed successfully.");
  } catch (err) {
    Logger.error("Error occurred during Firebase storage process.", err);
    throw err;
  }
}
