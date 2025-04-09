const MAPPING = {
    "Nome": "first-name",
    "Cognome": "last-name",
    "Luogo di nascita": "birthplace",
    "Data di nascita": "birthdate",
    "Comune di residenza": "residence-city",
    "Provincia di residenza": "residence-province",
    "Via di residenza": "residence-street",
    "Numero Civico": "civic-number",
    "Codice Fiscale": "fiscal-code",
    "Numero di telefono": "phone-number",
    "_email": "email",
    "Documento di riconoscimento": "identity-doc_fileId",
    "Tipologia utente": "user-type",
    "Carica all'interno dell'organizzazione": "organization-role",
    "Nome dell'organizzazione": "organization-name",
    "Sede dell'organizzazione": "organization-location",
    "Cod. Fisc dell'organizzazione": "organization-fiscal-code",
    "Partita IVA": "organization-vat",
    "PEC": "organization-pec",
    "Visura Camerale": "chamber-doc_fileId",
    "Codice POD": "pod-code",
    "Potenza impegnata": "committed-power",
    "Indirizzo della fornitura elettrica": "electricity-address",
    "Comune del contratto di fornitura di energia elettrica": 'electricity-address-city',
    "Fascia F1": "f1-usage",
    "Fascia F2": "f2-usage",
    "Fascia F3": "f3-usage",
    "Totale": "total-usage",
    "Bolletta elettrica": "electricity-bill_fileId",
    "Impianto fotovoltaico esistente": "existing-plant",
    "Data allacciamento rete": "connection-date",
    "Potenza installata": "peak-power",
    "Bolletta impianto di produzione": "electricity-bill-production_fileId",
    "Responsabile della protezione dei dati personali": "rpd-details",
    "Consenso trattamento dati personali": "personal-consent",
    "Consenso comunicazione dati personali": "communication-consent",
    "Consenso trattamento categorie particolari dati personali": "special-data-consent",
    "Luogo": "place",
    "Data": "date",
    "Firma": "signature-file_fileId",
    "Ruolo nella comunità energetica": { base: "user-role", alt: "user-role-other" },
    "Tipologia di utenza": { base: "pod-type", alt: "pod-type-other" },
    "Convenzioni attive di incentivo con il GSE": { base: "gse-incentive", alt: "incentive-details" },
    "Disponibilità realizzazione nuovo impianto": { base: "new-plant", alt: "avialable-surface" }
}

function remapData(data, mapping = MAPPING) {
    const mappedData = {};

    for (const key in mapping) {
        const mapValue = mapping[key];
        const mappedKey =
            typeof mapValue === "string" ? mapValue :
                data.hasOwnProperty(mapValue.alt) ? mapValue.alt :
                    data.hasOwnProperty(mapValue.base) ? mapValue.base :
                        null;

        if (mappedKey && data.hasOwnProperty(mappedKey)) {
            mappedData[key] = data[mappedKey];
        }
    }

    return mappedData;
}





