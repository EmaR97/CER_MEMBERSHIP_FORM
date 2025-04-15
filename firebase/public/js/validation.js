document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("pod-code");

    input.addEventListener("input", () => {
        input.value = input.value
            .replace(/[^a-zA-Z0-9]/g, '') // remove non-alphanumeric
            .toUpperCase()               // convert to uppercase
            .slice(0, 13);               // limit to 13 characters
    });
});
