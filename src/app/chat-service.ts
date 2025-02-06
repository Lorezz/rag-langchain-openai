interface SendRequest {
    message: string;
}
interface SendResponse {
    reply: string;
}

async function send({ message }: SendRequest) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error("Errore nella richiesta");

    return await response.json() as SendResponse;
}

export { send }