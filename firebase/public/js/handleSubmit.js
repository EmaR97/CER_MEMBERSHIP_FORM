const URL_FUNCTIONS = 'https://us-central1-cer-membership-form-aca75.cloudfunctions.net/uploadForm';
// const URL_FUNCTIONS = 'http://127.0.0.1:5001/cer-membership-form-aca75/us-central1/uploadForm';

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('clear-form').addEventListener('click', () => {
        document.getElementById('membership-form').reset();
        sessionStorage.clear();
    });

    document.getElementById('submit-form').addEventListener('click', () => {
        handleSubmit();
    });
    document.getElementById('signatureFileInput').setCustomValidity('Inserisci la tua firma.');
    const today = new Date().toISOString().split('T')[0];
    $('input[name="date"]').val(today);
    $("#messages .close-modal")[0].addEventListener('click', () => {
        $("#messages").fadeOut()
    })
});

function checkInputValidity() {
    const inputs = document.querySelectorAll('#membership-form input');
    const checkedGroups = new Set();

    for (const input of inputs) {
        if (input.disabled || !input.required) continue;
        const {type, name, value, checked} = input;

        if (type === 'checkbox' && !checked || type === 'radio' && !checkedGroups.has(name) && ![...document.querySelectorAll(`#membership-form input[type="radio"][name="${name}"]`)].some(r => r.checked) || !['checkbox', 'radio'].includes(type) && !value.trim()) {

            input.classList.add('invalid');
            input.focus();
            input.reportValidity();
            throw new Error(`Validation failed for ${type === 'radio' ? 'radio group' : 'input'}: ${name || input.id}`);
        }

        if (type === 'radio') checkedGroups.add(name);
        input.classList.remove('invalid');
    }
}


async function sendRequest(formObject) {
    try {
        const response = await fetch(URL_FUNCTIONS, {
            method: 'POST', headers: {
                'Content-Type': 'application/json',
            }, body: JSON.stringify(formObject),
        });

        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function extracted() {
    const formData = new FormData(document.getElementById('membership-form'));
    const formObject = {};
    const filePromises = Array.from(formData.entries()).map(([key, value]) => value instanceof File ? new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            formObject[key] = reader.result;
            resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(value);
    }) : formObject[key] = value);

    await Promise.all(filePromises);
    return formObject;
}


async function handleSubmit() {
    const messageModal = $("#messages");
    const modalClose = $("#messages .close-modal");
    const messageSection = $("#messages .modal-content")[0];

    try {
        checkInputValidity();
    } catch (e) {
        return
    }

    await generatePDF();
    modalClose.fadeOut()
    messageModal.fadeIn()
    messageSection.innerHTML = "<p>Attendere prego...</p>";
    try {
        const formObject = await extracted();
        await sendRequest(formObject); // Send the request after files are processed
        messageSection.innerHTML = "<p>La tua richiesta è stata inviata con successo!</p>" + "<p>Un responsabile ti contatterà presto per procedere con la richiesta di adesione.</p>" + "<p>Puoi chiudere questa pagina..</p>" + "<p>Grazie per la tua partecipazione.</p>";
        modalClose.fadeIn()
    } catch (error) {
        messageSection.innerHTML = "<p>Si è verificato un errore durante l'elaborazione della tua richiesta.</p>" + "<p>Per favore, riprova più tardi.</p>";
        modalClose.fadeIn()
        console.error('Form submission error:', error);
    }

}


function getToHide() {
    return [$('button'), $('input[type="file"]'), $('.pdf-page'), $(".signature-container div"), $(".signature-container img")];
}

function cleanStyle() {
    const [button, input_files, pdfPage, signCanvas, signImage] = getToHide();
    signImage.show()
    signCanvas.hide()
    button.hide();
    input_files.addClass('hidden');
    pdfPage.css({margin: '0 auto', 'box-shadow': 'none'});
}

function restoreStyle() {
    const [button, input_files, pdfPage, signCanvas, signImage] = getToHide();
    signImage.hide()
    signCanvas.show()
    input_files.removeClass('hidden');
    button.show();
    pdfPage.css({margin: '20px auto', 'box-shadow': '0 0 8px rgba(0,0,0,0.2)'});
}

const opt = {html2canvas: {scale: 2}};

function generatePDF() {
    return new Promise((resolve, reject) => {
        cleanStyle()
        html2pdf().set(opt).from(document.body).outputPdf('blob').then(blob => {
            const dt = new DataTransfer();
            dt.items.add(new File([blob], 'page.pdf', {type: 'application/pdf'}));
            document.getElementById('pdf-upload').files = dt.files;
            restoreStyle()
            resolve();
        }).catch(reject);
    });
}
