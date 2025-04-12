type FormData = {
    "first-name": string;
    "last-name": string;
    "birthplace": string;
    "birthdate": string;
    "residence-city": string;
    "residence-province": string;
    "residence-street": string;
    "civic-number": string;
    "fiscal-code": string;
    "phone-number": string;
    "email": string;
    "identity-doc_fileId": string;
    "user-type": string;
    "organization-role": string;
    "organization-name": string;
    "organization-location": string;
    "organization-fiscal-code": string;
    "organization-vat": string;
    "organization-pec": string;
    "chamber-doc_fileId": string;
    "pod-code": string;
    "committed-power": string;
    "electricity-address": string;
    "electricity-address-city": string;
    "f1-usage": string;
    "f2-usage": string;
    "f3-usage": string;
    "total-usage": string;
    "electricity-bill_fileId": string;
    "existing-plant": string;
    "connection-date": string;
    "peak-power": string;
    "electricity-bill-production_fileId": string;
    "rpd-details": string;
    "personal-consent": string;
    "communication-consent": string;
    "special-data-consent": string;
    "place": string;
    "date": string;
    "signature-file_fileId": string;
    "user-role": string;
    "user-role-other": string;
    "pod-type": string;
    "pod-type-other": string;
    "gse-incentive": string;
    "incentive-details": string;
    "new-plant": string;
    "avialable-surface": string;
};



export function parseFormData(input: any): FormData {
    let formData = Object.keys(input).reduce((acc, key) => {
        acc[key as keyof FormData] = input[key] ?? ""; // Fallback to empty string if missing
        return acc;
    }, {} as FormData);
    return formData;
}

