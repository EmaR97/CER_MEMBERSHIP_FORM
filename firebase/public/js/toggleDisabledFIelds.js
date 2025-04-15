const toggleDisabledFieldsOnChange = (radioName, valueToCheck, fieldNames, onChange = false) => {
    const fields = fieldNames.flatMap(name => Array.from(document.querySelectorAll(`input[name="${name}"]`)));
    const handleChange = (radio) => {
        const shouldDisable = radio.value === valueToCheck && radio.checked;
        fields.forEach(field => field.toggleAttribute("disabled", !shouldDisable));
    };
    document.querySelectorAll(`input[name="${radioName}"]`).forEach(radio => {
        if (onChange) radio.addEventListener("change", () => handleChange(radio)); else handleChange(radio);
    });
};

const toggleDisabledFieldsOnChangeAll = (onChange = false) => {
    const conditions = [{
        name: 'user-type',
        value: 'company',
        fields: ['comp-role', 'comp-addr', 'comp-name', 'comp-fiscal-code', 'vat', 'pec', 'comp-email', 'comp-phone-number', 'chamber-doc']
    }, {name: 'role-check', value: 'other', fields: ['other-role']}, {
        name: 'e-addr-same-res', value: 'no', fields: ['e-addr-city', "e-addr-prov", "e-addr-street", "e-addr-num"]
    }, {
        name: 'existing-plant',
        value: 'yes',
        fields: ['connection-date-year', "connection-date-month", "peak-power", "active-conventions", "active-conventions-list", "electricity-bill-prod"]
    }, {name: 'active-conventions', value: 'yes', fields: ["active-conventions-list"]}, {
        name: 'want-plant', value: 'yes', fields: ["available-surface"]
    }];

    conditions.forEach(({name, value, fields}) => toggleDisabledFieldsOnChange(name, value, fields, onChange));
};

document.addEventListener("DOMContentLoaded", () => toggleDisabledFieldsOnChangeAll(true));