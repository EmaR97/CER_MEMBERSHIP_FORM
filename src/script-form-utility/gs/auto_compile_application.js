/**
 * Validate and process unique elements in a set of values.
 *
 * @param {Object} values - An object with key-value pairs to be validated
 * @returns {Object} - A processed object with updated unique elements
 */
function validate(values) {
    const uniqueElementsDeepCopy = JSON.parse(JSON.stringify(uniqueElements_));

    // Add specific default values for checkboxes
    uniqueElementsDeepCopy['Convenzioni attive di incentivo con il GSE-1'] = CHECKBOX
    uniqueElementsDeepCopy['Convenzioni attive di incentivo con il GSE-0'] = CHECKBOX
    uniqueElementsDeepCopy['Disponibilità realizzazione nuovo impianto-0'] = CHECKBOX
    uniqueElementsDeepCopy['Disponibilità realizzazione nuovo impianto-1'] = CHECKED_CHECKBOX

    // Loop through the provided values to update unique elements
    Object.entries(values).forEach(([key, value]) => {
        if (value === VALUE_YES) {
            uniqueElementsDeepCopy[`${key}-1`] = CHECKED_CHECKBOX
            uniqueElementsDeepCopy[`${key}-0`] = CHECKBOX
        } else if (value === VALUE_NO) {
            uniqueElementsDeepCopy[`${key}-1`] = CHECKBOX
            uniqueElementsDeepCopy[`${key}-0`] = CHECKED_CHECKBOX
        } else {
            uniqueElementsDeepCopy[key] = value; // Keep the original value
        }

        // Specific condition for a given key
        if (key === 'Convenzioni attive di incentivo con il GSE' && value !== VALUE_NO) {
            uniqueElementsDeepCopy['Convenzioni attive di incentivo con il GSE-1'] = CHECKED_CHECKBOX;
        }
    })

    console.log(uniqueElementsDeepCopy)
    return uniqueElementsDeepCopy
}

/**
 * Update an image in a document based on a placeholder.
 *
 * @param {DocumentApp.Body} body - The body of a Google Document to update
 * @param {string} placeholder - The text placeholder indicating where to insert the image
 * @param {string} imageId - The ID of the image file in Google Drive
 */
function updateImage_(body, placeholder, imageId) {
    // Find paragraphs with the placeholder
    const matches = body.getParagraphs().filter(p => p.findText(placeholder))
    matches.forEach((element) => {
        // Get the image blob
        const imageBlob = DriveApp.getFileById(imageId).getBlob()
        // Add the image to the paragraph
        const image = element.addPositionedImage(imageBlob)


        const width = image.getWidth()
        const height = image.getHeight()
        // Calculate scaling ratio
        const ratio = IMAGE_WIDTH / width

        // Set the image size and replace the placeholder with a space
        image.setWidth(IMAGE_WIDTH).setHeight(height * ratio)
        element.replaceText(placeholder, ' ')
    })

}

/**
 * Replace text placeholders in a document body with specific values.
 *
 * @param {DocumentApp.Body} body - The body of a Google Document to update
 * @param {Object} inputTexts - An object with key-value pairs to replace placeholders
 */
function replacePlaceholder_(body, inputTexts) {
    // Validate the input texts
    inputTexts_validated = validate(inputTexts)

    // Replace placeholders with corresponding values
    Object.entries(inputTexts_validated).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        body.replaceText(placeholder, value);
    })

    // Replace remaining placeholders with a default pattern
    body.replaceText(PLACEHOLDER_PATTERN, '________');

}

/**
 * Update a document copy by replacing placeholders with text and inserting an image.
 *
 * @param {DriveApp.File} docCopy - The document copy to update
 * @param {Object} inputTexts - Key-value pairs for replacing text placeholders
 * @param {string} file_firma_id - The ID of the signature file for adding an image
 */
function updateDocCopy_(docCopy, inputTexts, file_firma_id) {
    try {
        const doc = DocumentApp.openById(docCopy.getId())
        const body = doc.getBody()

        // Update the image at the specified placeholder
        updateImage_(body, `{{${KEY_SIGNATURE}}}`, file_firma_id);

        // Replace text placeholders in the document body
        replacePlaceholder_(body, inputTexts)

        // Save and close the document
        doc.saveAndClose()
    } catch (error) {
        Logger.log(`Error updating document: ${error.message}`);
        Logger.log(`Error stack trace: ${error.stack}`);
        throw error; // Re-throw the error after logging
    }
}