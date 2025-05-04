"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function UploadForm() {
  const [result, setResult] = useState<{ text: string } | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/documentai", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    setResult(json);
  };
  console.log(result?.text.split("\n"));

  return (
    <Card className="w-full max-w-2xl mt-15">
      <CardHeader>
        <CardTitle>OCR</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload}>
          <Input type="file" name="file" accept="application/pdf, images/*" />
          <Button type="submit" className="mt-4">
            アップロード
          </Button>
          {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
        </form>
      </CardContent>
    </Card>
  );
}
