/**
 * Save data to a specified Google Sheet. The function manages the sheet headers and appends data as a new row.
 *
 * @param {Object} data - The data object to be saved. Keys represent column headers, and values are the corresponding data.
 */
function saveToSheet_(data) {
    // Open the specified Google Sheet and get the active sheet (default first sheet)
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();

    // Get the headers from the first row
    let headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];

    // If the sheet is new or empty, set the headers to the keys from the data object
    if (headers.every(header => header === "")) {
        headers = Object.keys(data);
        sheet.appendRow(headers);
    } else {
        // If headers exist, check if there are new keys in the data object
        const newHeaders = Object.keys(data).filter(key => !headers.includes(key));

        // If there are new headers, append them to the sheet and update the headers list
        if (newHeaders.length > 0) {
            sheet.appendRow(newHeaders);
            headers = [...headers, ...newHeaders];
        }
    }

    // Create a row with the data, mapping the values to the correct header positions
    const row = headers.map(header => data[header] || "");  // Use an empty string if data is missing for a header

    // Append the row with the data to the sheet
    sheet.appendRow(row);
}