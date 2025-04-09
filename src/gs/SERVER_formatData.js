var FILE_INPUTS = [
    "Documento di riconoscimento",
    "Visura Camerale",
    "Bolletta elettrica",
    "Bolletta impianto di produzione",
    "Firma"
];

function formatData(data) {
    // console.log("data",data)

    const { extracted: inputFilesURL, remaining: inputTexts } = separateFields(data, FILE_INPUTS);
    // console.log("inputFilesURL",inputFilesURL)

    // New object to hold the extracted file IDs
    const inputFilesID = {};
    // Extract file IDs from URLs in the extracted object
    for (const key in inputFilesURL) {
        inputFilesID[key] = extractFileIdFromUrl(inputFilesURL[key]);
    }
    // console.log("inputFilesID",inputFilesID)

    return {
        inputFilesID: inputFilesID,
        inputTexts: inputTexts,
    };
}


function separateFields(input, fieldsToExtract) {
    // Create a new object to hold the extracted fields
    var extracted = {};

    // Loop through the fields to extract
    fieldsToExtract.forEach(function (field) {
        if (input.hasOwnProperty(field)) {
            // Add the field to the extracted object
            extracted[field] = input[field];
            // Delete the field from the original input object
            delete input[field];
        }
    });

    return { extracted: extracted, remaining: input };
}





function extractFileIdFromUrl(url) {
    // Define a regular expression to extract the file ID
    var regex = /\/d\/([^\/]+)/;
    // Match the regex against the URL
    var matches = url.match(regex);

    if (matches && matches.length > 1) {
        // If a match is found, return the first captured group
        return matches[1];
    } else {
        // If no match is found, return null or an appropriate message
        return null; // or you could return 'Invalid URL'
    }
}

