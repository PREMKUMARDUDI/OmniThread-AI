import "dotenv/config";

const getGeminiAPIResponse = async (message, media = [], history = []) => {
  const formattedHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const promptText = message ? message : "Please analyze the attached files.";
  const parts = [{ text: promptText }];

  if (media && media.length > 0) {
    media.forEach((item) => {
      parts.push({
        inlineData: {
          mimeType: item.mimeType,
          data: item.data,
        },
      });
    });
  }

  const contents = [...formattedHistory, { role: "user", parts: parts }];

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: contents,
    }),
  };

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      options,
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";
    return responseText;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw new Error("Failed to fetch response from GenAI API");
  }
};

export default getGeminiAPIResponse;
