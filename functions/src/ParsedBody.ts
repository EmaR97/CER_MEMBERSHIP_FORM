// Types for the form request body
export interface ParsedBody {
    files: {
        mimeType: string, buffer: Buffer<ArrayBuffer>, folderPath: string, fileName: string
    } [];
    fields: { [key: string]: string };
}

// Parse the incoming request body
export function parseReq(formData: any): ParsedBody {
    const parsedBody: ParsedBody = {files: [], fields: {}};
    parsedBody.fields["_id"] = `${formData["fiscal-code"]}_${Date.now()}`;

    Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === "string") {
            if (value.startsWith("data:")) {
                const base64Data = value.split(",")[1];
                const mimeType = value.split(";")[0].split(":")[1];
                const buffer = Buffer.from(base64Data, "base64");
                parsedBody.files.push({
                    mimeType: mimeType, buffer: buffer, folderPath: parsedBody.fields["_id"], fileName: key
                });
                parsedBody.fields[key + "_fileId"] = "true";
            } else {
                parsedBody.fields[key] = value;
            }
        }
    });

    return parsedBody;
}