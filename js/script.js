document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('query-form');
    const input = document.getElementById('user-input');
    const output = document.getElementById('response-output');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const userInput = input.value;
        output.innerHTML = 'Loading...';

        try {
            // Fetch the contents of the meviy technical information document from GitHub using a CORS proxy
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const targetUrl = 'https://github.com/JonathenRobey/meviyTech/raw/refs/heads/main/Meviy%20Technical%20Information.docx';
            const documentResponse = await fetch(proxyUrl + targetUrl, {
                headers: {
                    'Origin': 'null'
                }
            });
            if (!documentResponse.ok) {
                throw new Error('Failed to fetch document contents');
            }
            const documentContents = await documentResponse.text();

            // Step 1: Initial relevance check using gpt-3.5-turbo
            const relevanceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are an assistant that will answer any questions related to meviy, the online on-demand manufacturing service.' },
                        { role: 'user', content: `Is the following request relevant to the contents of the meviy technical information document? Document: ${documentContents} Request: ${userInput}` }
                    ],
                    max_tokens: 50
                })
            });

            if (!relevanceResponse.ok) {
                const errorDetails = await relevanceResponse.text();
                throw new Error(`Network response was not ok: ${errorDetails}`);
            }

            const relevanceData = await relevanceResponse.json();
            const relevanceResult = relevanceData.choices[0].message.content.trim().toLowerCase();

            if (relevanceResult.includes('yes')) {
                // Step 2: Forward request to custom GPT if relevant
                const customGPTResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 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'
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are an assistant that will answer any questions related to meviy, the online on-demand manufacturing service.' },
                            { role: 'user', content: `Document: ${documentContents} Request: ${userInput}` }
                        ],
                        max_tokens: 150
                    })
                });

                if (!customGPTResponse.ok) {
                    const errorDetails = await customGPTResponse.text();
                    throw new Error(`Network response was not ok: ${errorDetails}`);
                }

                const customGPTData = await customGPTResponse.json();
                output.innerHTML = customGPTData.choices[0].message.content; // Adjust based on actual API response structure
            } else {
                output.innerHTML = "Sorry, your request doesn't seem to be related to the meviy software. Please try a new request.";
            }
        } catch (error) {
            console.error('Error:', error);
            output.innerHTML = 'Error: ' + error.message;
        }

        input.value = '';
    });
});
