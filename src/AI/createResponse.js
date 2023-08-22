import { Configuration, OpenAIApi } from "openai";
// Get the openai key from the .env file
// Load all the file name insisde the attributes folder into an object to provide as enums for the function calling

// Get the openai key from the .env file
const OPENAI_KEY = process.env.OPENAI_KEY;

const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);


export async function createResponse(messageMap, newSystemMessage=undefined) {
  let systemMessage = newSystemMessage || {
    role: "system", 
    content: `You are an AI discord bot name Linksai. Your primary role is to engage in quick witty banter. You have the ability to: mint NFTs, send tip links, receive tips, and send messages to other users. Let users know what you are capable of!`
  };

  let messages = [systemMessage];

  for (const [key, value] of messageMap.entries()) {
      for (const msg of value) {
        if(msg.author !== "Linksai")
        {
          messages.push({role: "user", content: `${msg.author}: ${msg.content}`});
        }
        else
        {
          messages.push({role: "assistant", content: `${msg.author}: ${msg.content}`});
        }
          
      }
  }

  const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

  return chatCompletion.data.choices[0].message.content.replace("Linksai: ", "").replace("tiplink-bot: ", "");
}

// Sample invocation
// await createResponse(conversations, newSystemMessage=mintSystemMessage);

