/**
 * Entry point for a Google Apps Script Web App triggered by a GET request.
 * This function loads an HTML template from the Apps Script project and
 * returns the evaluated content to be rendered in the web app.
 *
 * @returns {HtmlOutput} The rendered HTML content to be displayed in the web app.
 */
function doGet() {
    // Load and evaluate the 'Index' HTML template to create the web app's output
    return HtmlService.createTemplateFromFile('Index-full').evaluate();
}

/**
 * Handles form submission events by remapping the incoming data and saving it to a Google Sheet.
 * After saving the data, additional processing is performed, such as sending responses.
 *
 * @param {Object} data - The raw data submitted from the form.
 */
function onSubmit(data) {
    // Remap the incoming data to the expected format
    const remappedData = remapData(data);

    // Save the remapped data to a specified Google Sheet
    saveToSheet_(remappedData);

    // Extract relevant information for further processing
    const { inputFilesID: inputFilesId, inputTexts } = formatData(remappedData);

    // Perform additional processing, such as sending responses
    ScriptFormUtility.processResponse(inputTexts, inputFilesId);
}

/**
 * Uploads a base64-encoded file to a specified folder in Google Drive.
 * Returns the URL of the uploaded file for reference or further processing.
 *
 * @param {Object} file - An object containing the base64-encoded data, MIME type, and file name.
 * @returns {string} The URL of the uploaded file in Google Drive.
 */
function upload(file) {
    // Convert the base64-encoded data into a Blob with the specified MIME type and file name
    const fileBlob = Utilities.newBlob(Utilities.base64Decode(file.data), file.mimeType, file.fileName);

    // Retrieve the specified Google Drive folder by its ID
    const targetFolder = DriveApp.getFolderById(FOLDER_ID);

    // Create a new file in the Google Drive folder using the Blob
    const createdFile = targetFolder.createFile(fileBlob);

    // Return the URL of the newly created file
    return createdFile.getUrl();
}
var REDIRECT_URL = "http://www.stackoverflow.com";


function redirect() {
    return HtmlService.createHtmlOutput(
        "<script>window.top.location.href=\"" + REDIRECT_URL + "\";</script>"
    );
}