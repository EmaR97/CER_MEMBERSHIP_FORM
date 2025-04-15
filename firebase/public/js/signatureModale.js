$(function () {
    const $signaturePad = $("#signaturePad");
    const $signatureModal = $("#signatureModal");
    const $targetImg = $(".signature-preview");
    const fileInput = $("#signatureFileInput")[0];

    function dataURLtoFile(dataurl, filename) {
        const [header, base64Data] = dataurl.split(",");
        const mime = (header.match(/:(.*?);/) || [])[1];
        if (!mime) throw new Error("Invalid data URL");
        const binary = atob(base64Data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        return new File([array], filename, {type: mime});
    }

    function waitForFileSelection(input) {
        return new Promise(resolve => {
            const handler = () => {
                input.removeEventListener("change", handler);
                resolve(input.files);
            };
            input.addEventListener("click", e => {
                e.stopPropagation();
            });
            input.addEventListener("change", handler);
            input.click();
        });
    }

    function saveProducedSign() {
        const imageData = $signaturePad.jSignature("getData", "image");
        if (Array.isArray(imageData) && imageData.length > 1) {
            const imageDataUrl = `data:${imageData[0]},${imageData[1]}`;
            $targetImg.each(function () {
                $(this).attr("src", imageDataUrl).fadeIn(1);
            });
            console.log("Signature captured and assigned to image element.");
            try {
                const signatureFile = dataURLtoFile(imageDataUrl, "signature.png");
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(signatureFile);
                fileInput.files = dataTransfer.files;
                console.log("Signature stored into file input.");
            } catch (error) {
                console.error("Error converting signature:", error);
            }
        } else {
            console.warn("No signature data available in canvas.");
        }
        closeModal();
    }


    async function uploadSignImage() {
        const files = await waitForFileSelection(fileInput);
        if (!files || files.length === 0) {
            console.log("File selection canceled.");
            return;
        }
        const reader = new FileReader();
        reader.onload = event => $targetImg.attr("src", event.target.result);
        $targetImg.fadeIn(1);
        reader.readAsDataURL(files[0]);
        closeModal();
    }

    function closeModal() {
        $('body').css('overflow', ''); // Restore scrolling
        $signatureModal.fadeOut(200);
        $signaturePad.empty();
    }


    function openModal() {
        $('body').css('overflow', 'hidden'); // Disable scrolling
        $signatureModal.fadeIn(200);
        $signaturePad.jSignature({
            "decor-color": "transparent", width: $signaturePad.width(), height: $signaturePad.height(), lineWidth: 1
        });
    }

    $("#open-signature-modal").on("click", openModal);
    $("#saveSignature").off("click").on("click", saveProducedSign);
    $("#clearSignature").off("click").on("click", () => $signaturePad.jSignature("reset"));
    $("#uploadSignature").off("click").on("click", uploadSignImage);
    $(".close-modal").off("click").on("click", closeModal);
});
