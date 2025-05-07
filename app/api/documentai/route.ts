import { NextRequest, NextResponse } from "next/server";
import {
  DocumentProcessorServiceClient,
  protos,
} from "@google-cloud/documentai";
import OpenAI from "openai";
import { CHATGPT_PROMPT } from "../utils/constants";

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION;
const PROCESSOR_ID = process.env.GOOGLE_PROCESSOR_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const client = new DocumentProcessorServiceClient();
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const document = await extractDataFromDocumentAI(file);
    if (!document || !document.text) {
      return NextResponse.json(
        { error: "No text extracted from document" },
        { status: 500 },
      );
    }

    const entities = document?.entities || [];
    const result = formatDataWithChatGPT(entities, CHATGPT_PROMPT);

    return NextResponse.json({ text: document.text, data: result });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error while processing document" },
      { status: 500 },
    );
  }
}

// document ai
async function extractDataFromDocumentAI(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/pdf";

  const request: protos.google.cloud.documentai.v1.IProcessRequest = {
    name,
    rawDocument: {
      content: buffer.toString("base64"),
      mimeType,
    },
  };

  const [result] = await client.processDocument(request);
  return result.document;
}

// chatgpt
async function formatDataWithChatGPT(
  entities: protos.google.cloud.documentai.v1.Document.IEntity[],
  prompt: string,
) {
  const content = JSON.stringify(entities);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "`You are a helpful assistant that formats data.",
    },
    {
      role: "user",
      content: `${prompt}\n\nData:${content}`,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.3,
    });
    return completion.choices[0].message?.content;
  } catch (error) {
    console.log(error);
    return null;
  }
}
