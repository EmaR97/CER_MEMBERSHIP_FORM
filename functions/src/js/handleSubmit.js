document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('clear-form').addEventListener('click', () => {
        document.getElementById('membership-form').reset();
        sessionStorage.clear();
    });

    document.getElementById('submit-form').addEventListener('click', () => {
        handleSubmit();
    });
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
        const response = await fetch('http://127.0.0.1:5001/cer-membership-form-aca75/us-central1/uploadForm', {
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
    try {
        checkInputValidity();
    } catch (e) {
        return
    }
    await generatePDF();
    try {
        const formObject = await extracted();
        await sendRequest(formObject); // Send the request after files are processed
    } catch (error) {
        console.error('Form submission error:', error);
    }
}

const opt = {html2canvas: {scale: 2}};

function generatePDF() {
    return new Promise((resolve, reject) => {
        const [button, input_files, pdfPage] = [$('button'), $('input[type="file"]'), $('.pdf-page')];
        button.hide();
        input_files.hide();
        pdfPage.css({margin: '0 auto', 'box-shadow': 'none'});

        html2pdf().set(opt).from(document.body).outputPdf('blob').then(blob => {
            const dt = new DataTransfer();
            dt.items.add(new File([blob], 'page.pdf', {type: 'application/pdf'}));
            document.getElementById('pdf-upload').files = dt.files;
            input_files.show();
            button.show();
            pdfPage.css({margin: '20px auto', 'box-shadow': '0 0 8px rgba(0,0,0,0.2)'});
            resolve();
        }).catch(reject);
    });
}
