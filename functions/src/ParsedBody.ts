import {Logger} from "./Logger";
import {ParsingError} from "./CustomeErrors"; // Adjust the path if needed


export class ParsedBody {
    files: {
        mimeType: string; buffer: Buffer; folderPath: string; fileName: string;
    }[] = [];

    fields: { [key: string]: string } = {};

    constructor() {
    }

    /**
     * Parse the incoming request body into an instance of ParsedBody.
     * @param formData - The form data to parse.
     * @returns ParsedBody
     */
    public parseReq(formData: any): this {
        Logger.info("Starting request body parsing.");

        try {
            const id = `${Date.now()}_${formData["fiscal-code"]}`;
            this.fields["_id"] = id;

            Object.entries(formData).forEach(([key, value]) => {
                if (typeof value === "string") {
                    if (value.startsWith("data:")) {
                        const [meta, base64] = value.split(",");
                        const mimeType = meta.split(";")[0].split(":")[1];
                        const buffer = Buffer.from(base64, "base64");

                        this.files.push({
                            mimeType, buffer, folderPath: id, fileName: key,
                        });

                        this.fields[`${key}_fileId`] = "true";
                        Logger.debug(`Parsed file field: ${key}`, {mimeType});
                    } else {
                        this.fields[key] = value;
                        Logger.debug(`Parsed text field: ${key} = ${value}`);
                    }
                } else {
                    Logger.warn(`Skipping non-string field: ${key}`);
                }
            });

            Logger.info("Request body parsing completed.");
            return this;
        } catch (err) {
            Logger.error("Error parsing request body.", err);
            throw new ParsingError("Failed to parse request body", err);
        }
    }
}
