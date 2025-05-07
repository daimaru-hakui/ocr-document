"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { protos } from "@google-cloud/documentai";
import { useState } from "react";

export default function UploadForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    text: string;
    data: protos.google.cloud.documentai.v1.IDocument;
  } | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/documentai", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setIsLoading(false);
    }
    const json = await res.json();
    setResult(json);
    setIsLoading(false);
  };
  console.log(result?.text.split("\n"));
  console.log(result?.data);

  return (
    <Card className="w-full max-w-2xl mt-15">
      <CardHeader>
        <CardTitle>OCR</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="flex gap-3">
          <Input
            type="file"
            name="file"
            accept="application/pdf, images/*"
            className="cursor-pointer"
          />
          <Button type="submit" className="cursor-pointer">
            {isLoading ? "loading..." : "アップロード"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
