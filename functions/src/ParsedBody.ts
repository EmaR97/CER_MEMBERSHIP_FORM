// Types for the form request body
export interface ParsedBody {
    files: { [key: string]: string };
    fields: { [key: string]: string };
}

// Parse the incoming request body
export function parseReq(formData: any): ParsedBody {
    const parsedBody: ParsedBody = {files: {}, fields: {}};
    parsedBody.fields["_id"] = `${formData["fiscal-code"]}_${Date.now()}`;

    Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === "string") {
            if (value.startsWith("data:")) {
                const path = `${parsedBody.fields["_id"]}/${key}`;
                parsedBody.files[path] = value;
                parsedBody.fields[key + "_fileId"] = path;
            } else {
                parsedBody.fields[key] = value;
            }
        }
    });

    return parsedBody;
}