import {ValidationError} from "./CustomeErrors";

export function validateFormData(formData: any) {
    if (!formData || !formData["fiscal-code"]) {
        throw new ValidationError("Missing required field: fiscal-code");
    }
    return formData;
}