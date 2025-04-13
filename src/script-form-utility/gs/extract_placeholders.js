function main() {
    const body = DocumentApp.openById(DOC_TEMPLATE_ID_OR).getBody()
    result = getCurlyBraceContents(body, PLACEHOLDER_PATTERN); // Get all extracted content
    console.log(result)

}

/**
 * Extracts unique content within double curly braces from a Google Doc body.
 * @param {DocumentApp.Body} docBody - The Google Docs body to search.
 * @param {string} pattern - The regex pattern to find content within curly braces.
 * @returns {Object} - Unique content as keys with DEFAULT_EMPTY_TEXT as values.
 */
function getCurlyBraceContents(docBody, pattern) {
    const matches = docBody.getText().match(new RegExp(pattern, 'g')) || [];
    return matches.reduce((result, match) => {
        const key = match.slice(2, -2); // Trim leading/trailing braces
        result[key] = DEFAULT_EMPTY_TEXT;
        return result;
    }, {});
}



