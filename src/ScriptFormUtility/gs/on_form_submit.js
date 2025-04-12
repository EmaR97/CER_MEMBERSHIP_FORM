/**
 * Event handler for Google Form submission.
 *
 * @param {Object} e - Event object from Google Apps Script upon form submission
 * @param {FormApp.FormResponse} e.response - The form response object contained within the event
 */
function _onFormSubmit(e) {
    // Parse the form responses to extract text responses and file uploads
    const {[TYPE_TEXT]: inputTexts, [TYPE_FILE]: inputFilesId} = getResponses_(e.response);
    // Process the parsed responses
    processResponse(inputTexts, inputFilesId);
}

/**
 * Process parsed form responses to create document copies, update them, and send emails.
 *
 * @param {Object} parsedResponses - An object containing parsed text responses ("Text") and file uploads ("File")
 */
function processResponse(inputTexts, inputFilesId) {
    // Select the correct template ID based on user type
    const templateDocId = getTemplateId_(inputTexts['Tipologia utente'])
    // Get the folder where the document copies will be stored
    const pdfFolder = getPDFFolder_(inputFilesId[KEY_SIGNATURE]);
    // Create a document copy from the template, placing it in the correct folder
    const docCopy = createDocCopy_(templateDocId, pdfFolder, inputTexts[KEY_FULLNAME]);
    // Update the document copy with additional information
    updateDocCopy_(docCopy, inputTexts, inputFilesId[KEY_SIGNATURE]);
    // Create a PDF copy and add it to the file to send the user
    inputFilesId[PDF_FOLDER_NAME] = createPDFCopy_(docCopy, pdfFolder);
    // Remove the signature file from the list to avoid reprocessing
    delete inputFilesId[KEY_SIGNATURE];
    // Send the document as an email with the text and file attachments
    sendDocument_(inputTexts[KEY_EMAIL], inputTexts[KEY_FULLNAME], inputFilesId);
}


/**
 * Extract text responses and file uploads from a form response
 *
 * @param {FormApp.FormResponse} response - The Google Form response object
 * @param {Object} values - An optional object for additional input values (not used in this example)
 * @returns {Object} - An object with text responses and file uploads, with "Text" and "File" keys
 */
function getResponses_(response) {
    const inputFilesId = {}; // Object to store file upload responses
    const inputTexts = {
        [KEY_EMAIL]: response.getRespondentEmail() // Store the email of the respondent
    };
    response.getItemResponses().forEach(item => {
        const {getType, getTitle} = item.getItem();
        const responseValue = item.getResponse();

        if (getType() === FormApp.ItemType.FILE_UPLOAD) {
            inputFilesId[getTitle()] = responseValue[0]; // Add first file upload
        } else {
            inputTexts[getTitle()] = responseValue; // Add text response
        }
    });
    inputTexts[KEY_FULLNAME] = `${inputTexts['Nome']} ${inputTexts['Cognome']}`
    return {[TYPE_TEXT]: inputTexts, [TYPE_FILE]: inputFilesId};
}

function getTemplateId_(tipologia_utente) {
    return (tipologia_utente === 'Persone fisiche') ? DOC_TEMPLATE_ID_PF : DOC_TEMPLATE_ID_OR
}

/**
 * Get or create a folder by name within a specified parent folder.
 *
 * @param {DriveApp.Folder} parentFolder - The parent folder to search within
 * @param {string} name - The name of the folder to find or create
 * @returns {DriveApp.Folder} - The existing folder if found, or a new folder if not found
 */
function getFolderByName_(parentFolder, name) {
    const folders = parentFolder.getFoldersByName(name);
    if (folders.hasNext()) return folders.next(); // Return existing folder if found
    return parentFolder.createFolder(name); // Create and return a new folder
}


/**
 * Get the folder for storing PDF files based on a specific signature file ID.
 *
 * @param {string} file_firma_id - The ID of the signature file in Google Drive
 * @returns {DriveApp.Folder} - The PDF folder located by navigating through parent folders
 */
function getPDFFolder_(file_firma_id) {
    const signature_file = DriveApp.getFileById(file_firma_id);
    const responses_folder = signature_file.getParents().next().getParents().next(); // Navigate to the responses folder
    return getFolderByName_(responses_folder, PDF_FOLDER_NAME);// Get or create the PDF folder
}

/**
 * Create a unique file name for a document using the user's full name and current date/time.
 *
 * @param {string} fullname - The full name of the user
 * @returns {string} - A generated file name with a prefix, full name, and the current timestamp
 */
function createFileName_(fullname) {
    return `${FILE_NAME_PREFIX} ${fullname} ${new Date().toLocaleString()}`;
}

/**
 * Create a copy of a document template in the specified PDF folder and set its name.
 *
 * @param {string} tipologia_utente - The user type for selecting the correct template
 * @param {string} file_firma_id - The ID of the signature file in Google Drive
 * @param {string} fullname - The full name of the user
 * @returns {DriveApp.File} - A new copy of the document template with the specified name
 */
function createDocCopy_(docToCopyId, folder, fullname) {
    const template = DriveApp.getFileById(docToCopyId); // Get the template by user type
    const fileName = createFileName_(fullname); // Generate the file name
    return template.makeCopy(folder).setName(fileName); // Create a copy and set its name
}

/**
 * Create a PDF copy of a document and store it in the PDF folder.
 *
 * @param {DriveApp.File} docCopy - The document copy to convert to PDF
 * @param {string} file_firma_id - The ID of the signature file in Google Drive
 * @returns {DriveApp.File} - The created PDF copy stored in the specified folder
 */
function createPDFCopy_(docCopy, folder) {
    return folder.createFile(docCopy.getAs("application/pdf")).getId()
}

/**
 * Send an email with attached documents
 *
 * @param {string} recipient - Email address of the recipient
 * @param {string} name - Name of the recipient
 * @param {Object} inputFiles - Object with key-value pairs where the key is the desired file name, and the value is the Drive file ID
 */
function sendDocument_(recipient, name, inputFiles) {
    // Create a list of file blobs with correct names and extensions
    const files = Object.entries(inputFiles).map(([key, value]) => {
        const originalFile = DriveApp.getFileById(value);
        const extension = originalFile.getName().split('.').pop(); // Extract the file extension
        const fileBlob = originalFile.getBlob();

        fileBlob.setName(`${key}.${extension}`); // Name the blob with the specified key and extension
        return fileBlob;
    });

    // Set email options including HTML body and attachments
    const emailOptions = {
        bcc: "", cc: "", htmlBody: `
      <p>Salve ${name},</p>
      <p>In allegato trova il modulo da lei compilato tramite il Form Google.</p>
      <br>
      <p>Saluti,</p>
    `, attachments: files,
    };

    // Send the email with the specified options
    GmailApp.sendEmail(recipient, SUBJECT_PREFIX, "", emailOptions);
}




