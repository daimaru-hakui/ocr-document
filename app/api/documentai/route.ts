import {
  DocumentProcessorServiceClient,
  protos,
} from "@google-cloud/documentai";
import { NextRequest, NextResponse } from "next/server";

const client = new DocumentProcessorServiceClient();

const a = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log(a);

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION;
const PROCESSOR_ID = process.env.GOOGLE_PROCESSOR_ID;

const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

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
    const document = result.document;

    if (!document || !document.text) {
      return NextResponse.json(
        { error: "No text extracted from document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ text: document.text });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error while processing document" },
      { status: 500 },
    );
  }
}
