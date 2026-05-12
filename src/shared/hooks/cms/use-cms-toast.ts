"use client";

import { useToast } from "@/src/shared/hooks/use-toast";
import {
  CMSError,
  getErrorMessage,
} from "@/src/shared/utils/cms-error-handler";

/**
 * CMS-specific toast notifications hook
 * Provides convenient methods for showing success and error toasts
 * with appropriate styling and duration
 */
export function useCMSToast() {
  const { toast } = useToast();

  /**
   * Show a success toast notification
   * @param message - Success message to display
   * @param description - Optional detailed description
   */
  const showSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
      duration: 3000,
    });
  };

  /**
   * Show an error toast notification
   * Automatically extracts user-friendly message from CMSError
   * @param error - Error object (CMSError, Error, or unknown)
   * @param fallbackMessage - Optional fallback message if error parsing fails
   */
  const showError = (error: unknown, fallbackMessage?: string) => {
    const message =
      getErrorMessage(error) || fallbackMessage || "An error occurred";

    let description: string | undefined;

    // Add specific guidance for common errors
    if (error instanceof CMSError) {
      switch (error.code) {
        case "ARTICLE_INVALID_STATUS_TRANSITION":
          description = "Check the current article status and try again.";
          break;
        case "UNAUTHORIZED":
          description = "Please refresh the page and log in again.";
          break;
        case "NETWORK_ERROR":
          description = "Check your internet connection and try again.";
          break;
      }
    }

    toast({
      title: message,
      description,
      variant: "destructive",
      duration: 5000,
    });
  };

  /**
   * Show a loading toast notification
   * Returns the toast ID for later dismissal
   * @param message - Loading message to display
   */
  const showLoading = (message: string) => {
    return toast({
      title: message,
      description: "Please wait...",
      duration: Infinity, // Don't auto-dismiss
    });
  };

  /**
   * Show a copy-to-clipboard success toast
   * @param itemName - Name of the item that was copied (e.g., "Secret key", "Article link")
   */
  const showCopySuccess = (itemName: string = "Content") => {
    toast({
      title: `${itemName} copied!`,
      description: "The content has been copied to your clipboard.",
      variant: "default",
      duration: 2000,
    });
  };

  // Blog operation toasts
  const blogCreated = () =>
    showSuccess(
      "Blog created successfully",
      "You can now start adding articles.",
    );
  const blogUpdated = () => showSuccess("Blog updated successfully");
  const blogDeleted = () =>
    showSuccess(
      "Blog deleted successfully",
      "All associated articles have been removed.",
    );
  const blogKeyRegenerated = () =>
    showSuccess("Secret key regenerated", "The old key is no longer valid.");

  // Article operation toasts
  const articleCreated = () =>
    showSuccess(
      "Article created successfully",
      "Your article has been saved as a draft.",
    );
  const articleUpdated = () => showSuccess("Article updated successfully");
  const articleDeleted = () => showSuccess("Article deleted successfully");
  const articlePublished = () =>
    showSuccess(
      "Article published successfully",
      "Your article is now visible to the public.",
    );
  const articleArchived = () =>
    showSuccess(
      "Article archived successfully",
      "The article is no longer visible to the public.",
    );
  const articleUnarchived = () =>
    showSuccess(
      "Article restored successfully",
      "The article is visible to the public again.",
    );
  const articlesReordered = () =>
    showSuccess("Articles reordered successfully");

  // Image operation toasts
  const imagesUploaded = (count: number) =>
    showSuccess(
      `${count} image${count > 1 ? "s" : ""} uploaded successfully`,
      "Images have been added to your article.",
    );
  const imageUpdated = () => showSuccess("Image updated successfully");
  const imageDeleted = () => showSuccess("Image deleted successfully");
  const imagesReordered = () => showSuccess("Images reordered successfully");

  return {
    // Generic methods
    showSuccess,
    showError,
    showLoading,
    showCopySuccess,

    // Blog operations
    blogCreated,
    blogUpdated,
    blogDeleted,
    blogKeyRegenerated,

    // Article operations
    articleCreated,
    articleUpdated,
    articleDeleted,
    articlePublished,
    articleArchived,
    articleUnarchived,
    articlesReordered,

    // Image operations
    imagesUploaded,
    imageUpdated,
    imageDeleted,
    imagesReordered,
  };
}
