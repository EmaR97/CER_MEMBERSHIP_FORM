import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {defineSecret} from "firebase-functions/params";
import {parseReq} from "./ParsedBody";
import {storeDataToFirebase} from "./StoreToFirebase";
import {GoogleAPIService} from "./StoreToDrive";
import {ValidationError} from "./CustomeErrors";
import {fireAndForget} from "./utility";

const GOOGLE_CREDENTIALS_JSON = defineSecret('GOOGLE_CREDENTIALS_JSON');
const DRIVE_FOLDER_ID = "1JCbB955kdVMo-rcqpuwCGdSOvhDdO6tt";
const SHEET_ID = "1Rf15O4o3rUJJ-nhpBoKMHN-bNFSfE4el4rBGEt3x6MU";
const googleAPIService = new GoogleAPIService(DRIVE_FOLDER_ID, SHEET_ID);

initializeApp();

function validateFormData(formData: any) {
    if (!formData || !formData["fiscal-code"]) {
        throw new ValidationError("Missing required field: fiscal-code");
    }
    return formData;
}

// The noncritical tasks are kicked off afterward using the fire-and-forget helper.
export const uploadForm = onRequest({
    secrets: [GOOGLE_CREDENTIALS_JSON],
}, async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send(JSON.stringify({error: {message: "Method Not Allowed"}}));
            return;
        }

        const formData = validateFormData(req.body);
        const parsedBody = parseReq(formData);
        await storeDataToFirebase(parsedBody);

        // Send response quickly
        res.status(200).send(JSON.stringify({success: true}));

        // Do this asynchronously without blocking the response
        fireAndForget(() => googleAPIService.storeDataToDrive(parsedBody, JSON.parse(GOOGLE_CREDENTIALS_JSON.value())));
    } catch (err) {
        console.error("Error in main processing:", err);

        // Distinguish between known and unknown errors
        if (err instanceof ValidationError) {
            res.status(400).send(JSON.stringify({error: {message: err.message}}));
        } else {
            res.status(500).send(JSON.stringify({error: {message: "Internal Server Error"}}));
        }
    }
})


