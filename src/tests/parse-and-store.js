//irebase emulators:start --inspect-functions --only functions,firestore,storage
const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const mime = require('mime-types');

initializeApp();

function parse_req(req) {
    const formData = req.body;
    const parsedBody = {"files": {}, "fields": {}}


    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string' && value.startsWith('data:')) {
            parsedBody['files'][key] = value;
        } else {
            parsedBody['fields'][key] = value;
        }
    }
    return parsedBody;
}

exports.uploadForm = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const parsedBody = parse_req(req);

    for (const [key, value] of Object.entries(parsedBody["files"])) {
        const base64Data = value.split(',')[1];
        const mimeType = value.split(';')[0].split(':')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        await getStorage().bucket("documenti").file(key).save(buffer, {
            contentType: mimeType, public: true,
        });
    }

    const writeResult = await getFirestore()
        .collection("messages")
        .add({original: parsedBody['fields']});

    res.status(200).send();
});