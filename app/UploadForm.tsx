"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderCircle } from "lucide-react";
import React, { useState } from "react";

export default function UploadForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    data: {
      page: number | null;
      companyName: string | null;
      items: {
        product: string | null;
        color: string | null;
        quantity: number | null;
      }[];
    }[];
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
      return;
    }
    const json = await res.json();
    const data = json.data;
    console.log(data);
    // const cleaned = data.replace(/```json|```/g, "").trim();
    // console.log(cleaned);
    try {
      setResult({ data: JSON.parse(data || []) });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      return;
    }
  };

  return (
    <Card className="w-full max-w-2xl my-15">
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
          <Button type="submit" className="cursor-pointer w-24">
            {isLoading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "アップロード"
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer"
            onClick={() => {
              setResult(null);
            }}
          >
            リセット
          </Button>
        </form>
        {result && (
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>PAGE</TableHead>
                <TableHead>会社名</TableHead>
                <TableHead>色</TableHead>
                <TableHead>数量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data?.map((data, index: number) => (
                <React.Fragment key={index}>
                  {data.items
                    .filter((item) => item.quantity)
                    .map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{data.page}</TableCell>
                        <TableCell>{data.companyName}</TableCell>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
