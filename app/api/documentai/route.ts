import { NextRequest, NextResponse } from "next/server";
import {
  DocumentProcessorServiceClient,
  protos,
} from "@google-cloud/documentai";
import OpenAI from "openai";
import { SYSTEM_PROMPT, USER_PROMPT } from "../utils/prompt";

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

    const output = await extractTableTextFromDocumentAI(document);
    const result = await formatDataWithChatGPT(JSON.stringify(output));
    console.log(result);

    return NextResponse.json({ data: result });
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

// テキスト抽出関数（← 追加）
function getTextFromAnchor(
  anchor: protos.google.cloud.documentai.v1.Document.ITextAnchor,
  text: string,
): string {
  if (!anchor.textSegments) return "";
  return anchor.textSegments
    .map(({ startIndex = 0, endIndex = 0 }) => {
      const start =
        typeof startIndex === "number"
          ? startIndex
          : parseInt(startIndex?.toString() || "0");
      const end =
        typeof endIndex === "number"
          ? endIndex
          : parseInt(endIndex?.toString() || "0");
      return text.slice(start, end);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// Table抽出処理（← 既存関数を修正）
type Item = {
  product: string | null;
  color: string | null;
  quantity: number | null;
};

type PageData = {
  page: number;
  companyName?: string;
  items: Item[];
};

async function extractTableTextFromDocumentAI(
  documentJson: protos.google.cloud.documentai.v1.IDocument,
): Promise<PageData[]> {
  const pages = documentJson.pages || [];
  const fullText = documentJson.text || "";
  const result: PageData[] = [];

  for (const page of pages) {
    const pageData: PageData = {
      page: page.pageNumber ?? 1,
      items: [],
    };

    const companyName = [];

    if (page.formFields && page?.formFields[0].fieldValue?.textAnchor) {
      for (const field of page.formFields) {
        if (field.fieldValue?.textAnchor) {
          const text = getTextFromAnchor(
            field.fieldValue?.textAnchor,
            fullText,
          );
          companyName.push(text);
        }
      }
    }

    for (const table of page.tables || []) {
      for (const row of table.bodyRows || []) {
        const cells = row.cells || [];
        const item: Item = {
          product: null,
          color: null,
          quantity: null,
        };

        if (cells[0]?.layout?.textAnchor) {
          item.product = getTextFromAnchor(
            cells[0].layout.textAnchor,
            fullText,
          );
        }
        if (cells[1]?.layout?.textAnchor) {
          item.color =
            getTextFromAnchor(cells[1].layout.textAnchor, fullText) || null;
        }
        if (cells[2]?.layout?.textAnchor) {
          const qtyText =
            getTextFromAnchor(cells[2].layout.textAnchor, fullText) ?? "";
          const parsed = parseInt(qtyText);
          item.quantity = isNaN(parsed) ? null : parsed;
        }

        pageData.items.push(item);
        pageData.companyName = JSON.stringify(companyName);
      }
    }

    result.push(pageData);
  }

  return result;
}

// chatgpt
async function formatDataWithChatGPT(data: string) {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `${USER_PROMPT}\n\n Data:${data} \n`,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      //model: "gpt-4",
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0,
    });
    return completion.choices[0].message?.content;
  } catch (error) {
    console.log(error);
    return null;
  }
}
