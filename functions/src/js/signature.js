function initSignaturePad(signatureParent) {

    // Create the signature container elements dynamically
    const signatureDiv = $('<div class="signature"></div>');
    const signatureImage = $('<img alt="" src="" style="display: none">');
    const clearButton = $('<button style="margin-top: 10px" type="button">Cancella Firma</button>');
    const fileInput = $('<input required accept=".jpg, .jpeg, .png" class="form-control" name="signature-file" style="margin:0 0 0 38px;width: 90px" type="file">');

    // Append the elements to the signature container
    signatureParent.append(signatureDiv, signatureImage, clearButton, fileInput);

    const $sig = signatureDiv.jSignature({
        'decor-color': 'transparent', 'width': "235px", 'height': "100px", 'lineWidth': 1,
    });

    // Helper function to convert DataURL to a File object
    function dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
            throw new Error("Invalid data URL");
        }
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    signatureDiv.on('mouseleave', () => {
        const imageDataArray = $sig.jSignature("getData", "image");
        if (Array.isArray(imageDataArray) && imageDataArray.length > 1) {
            const mimeType = imageDataArray[0];
            const base64Data = imageDataArray[1];
            const imageDataUrl = `data:${mimeType},${base64Data}`;

            // Update the image element
            signatureImage.attr("src", imageDataUrl)
       ;  // If you want to hide the canvas after capturing
            console.log('Signature captured and assigned to image element.');

            // Create a File from the data URL
            try {
                const signatureFile = dataURLtoFile(imageDataUrl, 'signature.png');

                // Use DataTransfer to simulate a file selection
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(signatureFile);
                fileInput[0].files = dataTransfer.files;
                console.log('Signature stored into file input.');
            } catch (error) {
                console.error('Error converting signature to file:', error);
            }
        } else {
            console.warn('No signature data available to capture.');
        }
    });

    clearButton.click(() => {
        $sig.jSignature("reset");
        signatureDiv.show();
        signatureImage.hide();
        fileInput.val(''); // Clears the file input visually (note that fileInput[0].files is read-only)
        console.log('Signature cleared');
    });

    fileInput.on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const dataURL = event.target.result;
            console.log('File loaded, setting image source...');
            signatureDiv.hide();
            signatureImage.attr("src", dataURL).show();
            console.log('Signature image loaded from file input');
        };
        reader.readAsDataURL(file);
    });
}

$(function () {
    $(".signature-container").each(function () {
        initSignaturePad($(this));
    });
});
