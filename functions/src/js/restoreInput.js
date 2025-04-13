const storeInputData = (key, value) => {
    if (value !== '') sessionStorage.setItem(key, value)
}


const emptyInputData = (key) => sessionStorage.removeItem(key);

const loadIinputData = (key) => sessionStorage.getItem(key);

function saveFormToSession(form) {
    const seenNames = new Set();

    form?.querySelectorAll("input").forEach(input => {
        const {id, type, checked, name, value} = input;
        if (seenNames.has(name) && type !== "checkbox" && type !== "radio") {
            return;
        }

        if (type === "file") {
            return; // Ignore file inputs
        }

        if (type === "checkbox") {
            checked ? storeInputData(id, "true") : emptyInputData(id);
        } else if (type === "radio" && checked) {
            form.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                emptyInputData(radio.name);
            });
            storeInputData(name, value);
        } else if (type !== "checkbox" && type !== "radio") {
            storeInputData(name, value);
        }
        seenNames.add(name);
    });
}

function loadFormFromSession(form) {
    form?.querySelectorAll("input").forEach(input => {
        if (input.type === "file") {
            return; // Ignore file inputs
        }
        const value = loadIinputData(input.name);
        if (input.type === "checkbox") {
            input.checked = value === "true";
        } else if (input.type === "radio") {
            input.checked = loadIinputData(input.name) === input.value;
        } else if (value) {
            input.value = value;
        }
    });
    toggleDisabledFieldsOnChangeAll()
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("membership-form");

    loadFormFromSession(form);

    form?.addEventListener("change", () => {
        saveFormToSession(form);
        // loadFormFromSession(form);
    });
});