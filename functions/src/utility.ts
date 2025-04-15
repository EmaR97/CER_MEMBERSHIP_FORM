export function fireAndForget(task: () => Promise<void>, retryDelay = 5000, maxRetries = 3, attempt = 1): void {
    task().catch((error) => {
        if (attempt >= maxRetries) {
            console.error("Background task failed after maximum retries:", error);
            return;
        }

        console.error(`Background task failed (attempt ${attempt} of ${maxRetries}), retrying in ${retryDelay}ms`, error);

        setTimeout(() => {
            fireAndForget(task, retryDelay, maxRetries, attempt + 1);
        }, retryDelay);
    });
}