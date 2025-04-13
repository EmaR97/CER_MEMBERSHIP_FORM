function initSignaturePad(signatureContainer) {
    const image = $(signatureContainer).find("img");
    const containerSelector = $(signatureContainer).find("div");
    const fileInputSelector = $(signatureContainer).find("input");
    const clearButtonSelector = $(signatureContainer).find("button");

    const $sig = containerSelector.jSignature({
        'decor-color': 'transparent',
        'width': "235px",
        'height': "100px",
        'lineWidth': 1,  // Adjust this value to make the cursor smaller

    });

    clearButtonSelector.click(() => {
        $sig.jSignature("reset");
        containerSelector.show();
        image.hide();
        fileInputSelector.val(''); // Clears the file input
        console.log(`clearButtonSelector cleared`);
    });


    fileInputSelector.on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const dataURL = event.target.result;
            console.log('File loaded, setting image source...');
            containerSelector.hide();
            image.attr("src", dataURL).show();
            console.log(`containerSelector image loaded`);
        };
        reader.readAsDataURL(file);
    });
}

$(function () {
    initSignaturePad("#signature-parent-1");
    initSignaturePad("#signature-parent-2");
});