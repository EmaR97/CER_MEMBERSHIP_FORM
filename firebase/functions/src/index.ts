import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {defineSecret} from "firebase-functions/params";
import {ParsedBody} from "./ParsedBody";
import {storeDataToFirebase} from "./StoreToFirebase";
import {GoogleApiService} from "./StoreToDrive";
import {ValidationError} from "./CustomeErrors";
import {fireAndForget} from "./utility";
import {validateFormData} from "./Validation";
import {Logger} from "./Logger"; // <-- Import Logger
import cors from "cors";

const corsHandler = cors({origin: "https://cer-membership-form-aca75.web.app"}); // This will allow all origins, or specify a URL for security
const GOOGLE_CREDENTIALS_JSON = defineSecret("GOOGLE_CREDENTIALS_JSON");
const DRIVE_FOLDER_ID = "1JCbB955kdVMo-rcqpuwCGdSOvhDdO6tt";
const SHEET_ID = "1Rf15O4o3rUJJ-nhpBoKMHN-bNFSfE4el4rBGEt3x6MU";
const googleAPIService = new GoogleApiService(DRIVE_FOLDER_ID, SHEET_ID);

initializeApp();

export const uploadForm = onRequest({
  secrets: [GOOGLE_CREDENTIALS_JSON],
}, async (req, res) => {
  corsHandler(req, res, async () => {
    Logger.info("Received request for /uploadForm");
    try {
      if (req.method !== "POST") {
        Logger.warn("Rejected non-POST request.");
        res.status(405).send(JSON.stringify({error: {message: "Method Not Allowed"}}));
        return;
      }

      Logger.info("Validating form data.");
      const formData = validateFormData(req.body);

      Logger.info("Parsing request body.");
      const parsedBody = new ParsedBody().parseReq(formData);

      Logger.info("Storing parsed data to Firebase.");
      await storeDataToFirebase(parsedBody);

      Logger.info("Responding to client with success.");
      res.status(200).send(JSON.stringify({success: true}));

      Logger.info("Kicking off asynchronous Google API upload.");
      fireAndForget(() => {
        const creds = JSON.parse(GOOGLE_CREDENTIALS_JSON.value());
        Logger.debug("Google credentials loaded for async task.");
        return googleAPIService.uploadData(parsedBody, creds);
      });
    } catch (err) {
      Logger.error("Error in main processing:", err);

      if (err instanceof ValidationError) {
        Logger.warn("Validation error occurred:", err.message);
        res.status(400).send(JSON.stringify({error: {message: err.message}}));
      } else {
        res.status(500).send(JSON.stringify({error: {message: "Internal Server Error"}}));
      }
    }
  });
});
