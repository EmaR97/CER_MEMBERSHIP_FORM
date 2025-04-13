const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

function parse_req(req) {
    // Parse JSON body
    const formData = req.body;

    // Assuming the formData object contains fields and files (encoded as base64)
    const fields = {};
    const files = {};

    // Iterate through the formData to extract fields and files
    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string' && value.startsWith('data:')) {
            // This is a base64 encoded file
            const fileBuffer = Buffer.from(value.split(',')[1], 'base64'); // Remove "data:image/png;base64," part
            files[key] = fileBuffer;
        } else {
            // This is a regular field
            fields[key] = value;
        }
    }
    return {fields, files};
}

exports.uploadForm = functions.https.onRequest((req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    const {fields, files} = parse_req(req);

    // Now you can do anything you need with fields and files
    // For example, upload the files to Firebase Storage or save data to Firestore

    res.status(200).send({
        message: 'Form received!', fields: fields, files: files,
    });
});
