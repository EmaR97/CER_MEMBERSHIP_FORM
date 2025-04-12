import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {parseFormData} from "./FormData"

import fs from 'fs';
import path from 'path';

// Path to your HTML template
const filePath = path.join(__dirname, '../resources/Template-Richiesta_Adesione_CER-Persone_Fisiche.html');
// Initialize Firebase app
initializeApp();

// Types for the form request body
interface ParsedBody {
    files: { [key: string]: string };
    fields: { [key: string]: string };
}

// Parse the incoming request body
function parseReq(formData: any, id: string): ParsedBody {
    const parsedBody: ParsedBody = {files: {}, fields: {}};

    Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === "string") {
            if (value.startsWith("data:")) {
                const path = `${id}/${key}`;
                parsedBody.files[path] = value;
                parsedBody.fields[key + "_fileId"] = path;
            } else {
                parsedBody.fields[key] = value;
            }
        }
    });

    return parsedBody;
}

const BUCKET = "files";
const COLLECTION = "data";

function extracted() {

// Define a mapping of the current placeholders to shorter ones
    const placeholderMapping: { [key: string]: string } = {
        'Nome': 'first-name',
        'Cognome': 'last-name',
        'Luogo di nascita': 'birthplace',
        'Data di nascita': 'birthdate',
        'Comune di residenza': 'residence-city',
        'Via di residenza': 'residence-street',
        'Numero Civico': 'civic-number',
        'Codice Fiscale': 'fiscal-code',
        'Numero di telefono': 'phone-number',
        '_email': 'email',
        'Comune del contratto di fornitura di energia elettrica': 'electricity-address-city',
        'Ruolo nella comunità energetica': 'organization-role',
        'Codice POD': 'pod-code',
        'Tipologia di utenza': 'user-type',
        'Potenza impegnata': 'committed-power',
        'Indirizzo della fornitura elettrica': 'electricity-address',
        'Fascia F1': 'f1-usage',
        'Fascia F2': 'f2-usage',
        'Fascia F3': 'f3-usage',
        'Totale': 'total-usage',
        'Impianto fotovoltaico esistente-0': 'existing-plant-0',
        'Impianto fotovoltaico esistente-1': 'existing-plant-1',
        'Data allacciamento rete': 'connection-date',
        'Potenza installata': 'peak-power',
        'Convenzioni attive di incentivo con il GSE-0': 'gse-incentive-0',
        'Convenzioni attive di incentivo con il GSE-1': 'gse-incentive-1',
        'Convenzioni attive di incentivo con il GSE': 'gse-incentive',
        'Disponibilità realizzazione nuovo impianto-0': 'new-plant-0',
        'Disponibilità realizzazione nuovo impianto-1': 'new-plant-1',
        'Disponibilità realizzazione nuovo impianto': 'new-plant',
        'Data': 'date',
        'Firma': 'signature-file',
        'Responsabile della protezione dei dati personali': 'data-protection-officer',
        'Consenso trattamento dati personali-1': 'personal-consent-1',
        'Consenso trattamento dati personali-0': 'personal-consent-0',
        'Consenso comunicazione dati personali-1': 'communication-consent-1',
        'Consenso comunicazione dati personali-0': 'communication-consent-0',
        'Consenso trattamento categorie particolari dati personali-1': 'special-data-consent-1',
        'Consenso trattamento categorie particolari dati personali-0': 'special-data-consent-0'
    };

// Read the HTML file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        // Regular expression to match {{placeholders}}
        const regex = /{{(.*?)}}/g;

        // Replace placeholders with shorter versions from the mapping
        let updatedData = data;
        updatedData = updatedData.replace(regex, (match, placeholder) => {
            // Check if the placeholder exists in the mapping and replace
            const shortPlaceholder = placeholderMapping[placeholder.trim()];
            return shortPlaceholder ? `{{${shortPlaceholder}}}` : match;
        });

        // Save the updated HTML to a new file
        const outputFilePath = path.join(__dirname, '../resources/Updated_Template.html');
        fs.writeFile(outputFilePath, updatedData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Updated template saved as Updated_Template.html');
            }
        });
    });
}

export const uploadForm = onRequest(async (req, res) => {
    debugger
    try {
        extracted();

        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        const formData = req.body;
        if (!formData || !formData['fiscal-code']) {
            res.status(400).send("Missing required field: fiscal-code");
            return
        }

        const id = `${formData['fiscal-code']}_${Date.now()}`; // Get the generated ID
        const parsedBody = parseReq(formData, id);

        // Handle file uploads
        for (const [key, value] of Object.entries(parsedBody.files)) {
            const base64Data = value.split(",")[1];
            const mimeType = value.split(";")[0].split(":")[1];
            const buffer = Buffer.from(base64Data, "base64");

            await getStorage()
                .bucket(BUCKET)
                .file(key)
                .save(buffer, {
                    contentType: mimeType, public: true,
                });
        }

        const data = parseFormData(parsedBody.fields);

        await getFirestore()
            .collection(COLLECTION).doc(id).set(data);

        res.status(200).send("Upload successful!");
    } catch (error) {
        console.error("Error uploading form:", error);
        res.status(500).send("Internal Server Error");
    }
});

