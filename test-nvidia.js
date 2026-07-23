require("dotenv").config({
  path: ".env.local",
});

const key = process.env.NVIDIA_API_KEY;

console.log(
  "Key loaded:",
  key ? "YES" : "NO"
);

fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "meta/llama-3.1-8b-instruct",
    messages: [
      {
        role: "user",
        content: "Say hello",
      },
    ],
    max_tokens: 20,
  }),
})
.then((r) => r.text())
.then(console.log)
.catch(console.error);
