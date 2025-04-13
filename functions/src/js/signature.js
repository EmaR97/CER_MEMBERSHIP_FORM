function initSignaturePad(signatureContainer) {
    const signatureParent = $(signatureContainer);

    // Create the signature container elements dynamically
    const signatureDiv = $('<div class="signature"></div>');
    const signatureImage = $('<img alt="" src="" style="display: none">');
    const clearButton = $('<button style="margin-top: 10px" type="button">Cancella Firma</button>');
    const fileInput = $('<input accept=".jpg, .jpeg, .png" class="form-control" name="signature-file" style="margin:0 0 0 38px;width: 90px" type="file">');

    // Append the elements to the signature container
    signatureParent.append(signatureDiv, signatureImage, clearButton, fileInput);

    const $sig = signatureDiv.jSignature({
        'decor-color': 'transparent', 'width': "235px", 'height': "100px", 'lineWidth': 1,  // Adjust this value to make the cursor smaller
    });

    clearButton.click(() => {
        $sig.jSignature("reset");
        signatureDiv.show();
        signatureImage.hide();
        fileInput.val(''); // Clears the file input
        console.log(`clearButtonSelector cleared`);
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
            console.log(`signatureDiv image loaded`);
        };
        reader.readAsDataURL(file);
    });
}

$(function () {
    initSignaturePad("#signature-parent-1");
    initSignaturePad("#signature-parent-2");
});
