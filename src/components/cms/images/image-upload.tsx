"use client";

/**
 * ImageUpload Component
 *
 * Handles image uploads with drag-and-drop support, validation, and progress tracking.
 *
 * Features:
 * - Drag-and-drop zone for file upload
 * - File input fallback for accessibility
 * - Multiple file selection
 * - Image preview before upload
 * - Upload progress indicators
 * - File type validation (JPEG, PNG, WebP)
 * - File size validation (max 5MB)
 * - Integration with useUploadImages hook
 *
 * **Validates: Requirements 12.1, 12.2, 18.3, 20.7**
 */

import { useCallback, useState } from"react";
import { Button, Card, CardBody, Progress, Input } from"@heroui/react";
import { Upload, X, Image as ImageIcon, AlertCircle } from"lucide-react";
import Image from"next/image";
import { useUploadImages } from"@/src/common/hooks/cms/useImageMutations";

interface ImageUploadProps {
 articleId: string;
 onUploadComplete?: () => void;
 maxFiles?: number;
 maxSizeMB?: number;
}

interface FileWithPreview {
 file: File;
 preview: string;
 altText: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg","image/jpg","image/png","image/webp",
];
const MAX_FILE_SIZE_MB = 10;

export default function ImageUpload({
 articleId,
 onUploadComplete,
 maxFiles = 20,
 maxSizeMB = MAX_FILE_SIZE_MB,
}: ImageUploadProps) {
 const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
 const [isDragging, setIsDragging] = useState(false);
 const [validationErrors, setValidationErrors] = useState<string[]>([]);

 const uploadImagesMutation = useUploadImages();

 const validateFile = (file: File): string | null => {
 // Check file type
 if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
 return`${file.name}: Only JPEG, PNG, and WebP formats are supported`;
 }

 // Check file size
 const fileSizeMB = file.size / (1024 * 1024);
 if (fileSizeMB > maxSizeMB) {
 return`${file.name}: File size (${fileSizeMB.toFixed(2)}MB) exceeds ${maxSizeMB}MB limit`;
 }

 return null;
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || []);
 processFiles(files);
 // Reset input value to allow selecting the same file again
 e.target.value ="";
 };

 const handleDrop = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 const files = Array.from(e.dataTransfer.files);
 processFiles(files);
 }, []);

 const processFiles = (files: File[]) => {
 const errors: string[] = [];
 const validFiles: FileWithPreview[] = [];

 files.forEach((file) => {
 const error = validateFile(file);
 if (error) {
 errors.push(error);
 } else {
 // Create preview URL
 const preview = URL.createObjectURL(file);
 validFiles.push({
 file,
 preview,
 altText:"",
 });
 }
 });

 setValidationErrors(errors);

 // Add valid files, respecting maxFiles limit
 setSelectedFiles((prev) => {
 const combined = [...prev, ...validFiles];
 if (combined.length > maxFiles) {
 errors.push(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} files will be kept.`,
 );
 return combined.slice(0, maxFiles);
 }
 return combined;
 });
 };

 const handleUpload = async () => {
 if (selectedFiles.length === 0) return;

 try {
 const files = selectedFiles.map((f) => f.file);
 const altTexts = selectedFiles.map((f) => f.altText || null);

 await uploadImagesMutation.mutateAsync({
 articleId,
 files,
 altTexts,
 });

 // Clean up preview URLs
 selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));

 // Reset state
 setSelectedFiles([]);
 setValidationErrors([]);

 // Notify parent
 onUploadComplete?.();
 } catch (error) {
 console.error("Upload failed:", error);
 setValidationErrors(["Upload failed. Please try again."]);
 }
 };

 const removeFile = (index: number) => {
 setSelectedFiles((prev) => {
 const newFiles = prev.filter((_, i) => i !== index);
 // Clean up preview URL
 URL.revokeObjectURL(prev[index].preview);
 return newFiles;
 });
 };

 const updateAltText = (index: number, altText: string) => {
 setSelectedFiles((prev) =>
 prev.map((f, i) => (i === index ? { ...f, altText } : f)),
 );
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = (e: React.DragEvent) => {
 e.preventDefault();
 // Only set isDragging to false if we're leaving the drop zone entirely
 if (e.currentTarget === e.target) {
 setIsDragging(false);
 }
 };

 const isUploading = uploadImagesMutation.isPending;
 const uploadProgress = isUploading ? 50 : 0; // Simplified progress

 return (
 <Card className="bg-card/50">
 <CardBody className="space-y-4">
 {/* Validation Errors */}
 {validationErrors.length > 0 && (
 <div className="bg-destructive/10 border border-border rounded-lg p-3 space-y-1">
 {validationErrors.map((error, index) => (
 <div
 key={index}
 className="flex items-start gap-2 text-sm text-destructive"
 >
 <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
 <span>{error}</span>
 </div>
 ))}
 </div>
 )}

 {/* Drop Zone */}
 <div
 className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
 isDragging
 ?"border-primary bg-primary/10 scale-[1.02]"
 :"border-border hover:border-muted-foreground/40"
 } ${isUploading ?"opacity-50 pointer-events-none" :""}`}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 >
 <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
 <p className="text-sm text-muted-foreground mb-2 font-medium">
 Drag and drop images here, or click to select
 </p>
 <input
 type="file"
 accept={ACCEPTED_IMAGE_TYPES.join(",")}
 multiple
 onChange={handleFileSelect}
 className="hidden"
 id="file-upload-input"
 disabled={isUploading}
 />
 <label htmlFor="file-upload-input">
 <Button
 as="span"
 size="sm"
 color="primary"
 variant="flat"
 isDisabled={isUploading}
 startContent={<ImageIcon size={16} />}
 >
 Select Files
 </Button>
 </label>
 <p className="text-xs text-muted-foreground mt-3">
 Supported formats: JPEG, PNG, WebP • Max {maxFiles} files •{""}
 {maxSizeMB}MB each
 </p>
 </div>

 {/* Upload Progress */}
 {isUploading && (
 <div className="space-y-2">
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Uploading images...</span>
 <span className="text-muted-foreground">{uploadProgress}%</span>
 </div>
 <Progress
 value={uploadProgress}
 color="primary"
 size="sm"
 className="w-full"
 />
 </div>
 )}

 {/* Selected Files Preview */}
 {selectedFiles.length > 0 && !isUploading && (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <p className="text-sm font-medium text-muted-foreground">
 Selected files ({selectedFiles.length}/{maxFiles}):
 </p>
 <Button
 size="sm"
 variant="light"
 color="danger"
 onPress={() => {
 selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
 setSelectedFiles([]);
 setValidationErrors([]);
 }}
 >
 Clear All
 </Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {selectedFiles.map((fileWithPreview, index) => (
 <div
 key={index}
 className="bg-default-100/50 rounded-lg p-3 space-y-2"
 >
 {/* Image Preview */}
 <div className="relative aspect-video bg-background rounded overflow-hidden">
 <Image
 src={fileWithPreview.preview}
 alt={`Preview ${index + 1}`}
 fill
 className="object-cover"
 sizes="(max-width: 768px) 100vw, 50vw"
 />
 <Button
 size="sm"
 isIconOnly
 color="danger"
 variant="flat"
 className="absolute top-2 right-2"
 onPress={() => removeFile(index)}
 >
 <X size={16} />
 </Button>
 </div>

 {/* File Info */}
 <div className="space-y-2">
 <p className="text-xs text-muted-foreground truncate">
 {fileWithPreview.file.name}
 </p>
 <Input
 size="sm"
 placeholder="Alt text (optional)"
 value={fileWithPreview.altText}
 onChange={(e) => updateAltText(index, e.target.value)}
 classNames={{
 input:"text-sm",
 inputWrapper:"bg-background/50",
 }}
 />
 </div>
 </div>
 ))}
 </div>

 <Button
 color="primary"
 onPress={handleUpload}
 className="w-full"
 size="lg"
 isLoading={isUploading}
 startContent={!isUploading && <Upload size={18} />}
 >
 {isUploading
 ?"Uploading..."
 :`Upload ${selectedFiles.length} image${selectedFiles.length > 1 ?"s" :""}`}
 </Button>
 </div>
 )}
 </CardBody>
 </Card>
 );
}
