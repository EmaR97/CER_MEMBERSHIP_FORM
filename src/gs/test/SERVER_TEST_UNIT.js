function test_remapData() {
    const inputData = {
        "first-name": "John",
        "birthplace": "Rome",
        "birthdate": "1990-05-20",
        "residence-city": "Milan",
        "residence-province": "MI",
        "signature-file_fileId": "12345",
        "user-role": "Member",
        "pod-type": "Residential",
        "incentive-details": "Solar panels subsidy",
        "new-plant": "200 sq meters",
        "avialable-surface": "200 sq meters"
    };

    // Using the remapData function
    const remappedUserData = remapData(inputData, MAPPING);

    console.log(remappedUserData);
}


function test_extractFileIdFromUrl() {
    // Given Google Drive file URL
    var url = 'https://drive.google.com/file/d/1IXPrTiGS1US2amVtZjLfWKkZM2rO7b1H/view?usp=drivesdk';

    // Extract the file ID
    var fileId = extractFileIdFromUrl(url);

    console.log("File ID:", fileId); // Should print the extracted file ID
}

function test_formatData() {
    var data = {
        "Documento di riconoscimento": 'https://drive.google.com/file/d/1IXPrTiGS1US2amVtZjLfWKkZM2rO7b1H/view?usp=drivesdk',
        "Visura Camerale": 'https://drive.google.com/file/d/1FYpFX8aX4HdT7NQ3ZrHg7CGeR7jShuGx/view?usp=drivesdk',
        "Bolletta elettrica": 'https://drive.google.com/file/d/1PjLv6BMeV8fR6rdw7D_bS8Hyq3T6bSf3/view?usp=drivesdk',
        "Firma": "Digital Signature",
        "Nome": "John Doe",
        "Cognome": "Smith"
    };

    var FILE_INPUTS = ["Documento di riconoscimento", "Visura Camerale", "Bolletta elettrica"];

    var result = formatData(data, FILE_INPUTS);

    console.log("Extracted File IDs:", result.inputFilesID); // Should contain the extracted file IDs
    console.log("Remaining Texts:", result.inputTexts); // Should contain remaining fields without the URLs
}


function test_separateFields() {
    // Original input object
    var input = {
        "Documento di riconoscimento": "value1",
        "Visura Camerale": "value2",
        "Bolletta elettrica": "value3",
        "Bolletta impianto di produzione": "value4",
        "Firma": "value5"
    };

    // Fields to extract
    var fieldsToExtract = ["Documento di riconoscimento", "Visura Camerale"];

    // Separate fields
    var result = separateFields(input, fieldsToExtract);

    console.log("Extracted:", result.extracted); // Should contain the extracted fields
    console.log("Remaining:", result.remaining); // Should contain the input object with the extracted fields removed
}