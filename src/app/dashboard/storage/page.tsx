"use client";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { Folder, File, Cloud, Upload } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

// Mock data
const mockFiles = [
  { id: 1, name: "images", type: "folder", size: "--", items: 12 },
  { id: 2, name: "documents", type: "folder", size: "--", items: 5 },
  { id: 3, name: "logo.png", type: "file", size: "1.2 MB", items: null },
  { id: 4, name: "banner.jpg", type: "file", size: "3.5 MB", items: null },
  { id: 5, name: "report.pdf", type: "file", size: "5.1 MB", items: null },
];

export default function StoragePage() {
  return (
    <LayoutScopeRoot routeActive="storage">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Cloud className="w-8 h-8 text-blue-500" />
            Blob Storage
          </h1>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockFiles.map((file) => (
            <Card
              key={file.id}
              className="bg-[#16162a] border-gray-800 hover:bg-[#1e1e3a] transition-colors cursor-pointer group"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${file.type === "folder" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}
                >
                  {file.type === "folder" ? (
                    <Folder className="w-6 h-6" />
                  ) : (
                    <File className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-200 group-hover:text-white transition-colors capitalize">
                    {file.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {file.type === "folder" ? `${file.items} items` : file.size}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
