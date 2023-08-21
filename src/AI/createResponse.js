import { Configuration, OpenAIApi } from "openai";
// Get the openai key from the .env file
// Load all the file name insisde the attributes folder into an object to provide as enums for the function calling

// Get the openai key from the .env file
const OPENAI_KEY = process.env.OPENAI_KEY;

const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);


export async function createResponse(message) {
    console.log(message);
    const chatCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",

        messages: [
            {role: "system", content: `You are an AI discord bot name tippy and you help users by sending them monetary tips. You will send a link at the end of this message containing a monetary tip with a random amount of money, be very polite and helpful.`},
            {role: "user", content: message}
        ],
      });
      return chatCompletion.data.choices[0].message.content;
}
