"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import {
  Folder,
  Image as ImageIcon,
  FileText,
  Film,
  File,
  Search,
  Upload,
  Trash,
  X,
  Edit,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import {
  useAssets,
  useUploadAsset,
  useDeleteAsset,
  useUpdateAsset,
} from "@/src/common/hooks/cms/use-assets";
import { MediaAsset, MediaCollection } from "@/src/common/@types/@cms-media";

// Utility formatting
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function StoragePage() {
  const t = useTranslations();

  // State
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editAltText, setEditAltText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: collectionsData, isLoading: isLoadingCollections } =
    useCollections({ limit: 100 });
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets(
    { collection_id: selectedCollectionId ?? undefined, search: searchQuery },
    { limit: 100 },
  );

  // Mutations
  const { mutateAsync: uploadAsset, uploadProgress } = useUploadAsset();
  const { mutateAsync: deleteAsset } = useDeleteAsset();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const collections = collectionsData?.data || [];
  const assets = assetsData?.data || [];

  // Default selection to first collection
  useEffect(() => {
    if (collections.length > 0 && selectedCollectionId === null) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  // Handlers
  const openEditModal = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setEditAltText(asset.alt_text || "");
    setIsEditingMetadata(false);
  };

  const handleDelete = async (assetId: number) => {
    if (
      confirm(
        "Você tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.",
      )
    ) {
      try {
        await deleteAsset(assetId);
        if (selectedAsset?.id === assetId) {
          setSelectedAsset(null);
        }
      } catch (error) {
        console.error("Falha ao excluir o asset", error);
        alert("Ocorreu um erro ao tentar excluir o arquivo.");
      }
    }
  };

  const handleUpdateMetadata = async () => {
    if (!selectedAsset) return;
    try {
      await updateAsset({
        id: selectedAsset.id,
        data: { alt_text: editAltText },
      });
      setIsEditingMetadata(false);
      setSelectedAsset({ ...selectedAsset, alt_text: editAltText });
    } catch (error) {
      console.error("Erro ao atualizar metadata", error);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedCollectionId) return;

    const collection = collections.find((c) => c.id === selectedCollectionId);

    Array.from(files).forEach(async (file) => {
      // Very basic validation based on collection rules
      if (collection?.max_file_size && file.size > collection.max_file_size) {
        alert(`O arquivo ${file.name} excede o tamanho máximo.`);
        return;
      }

      try {
        await uploadAsset({
          file,
          collection_id: selectedCollectionId,
        });
      } catch (error) {
        console.error("Erro no upload", error);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag n Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const renderAssetIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (mimeType.startsWith("video/"))
      return <Film className="w-8 h-8 text-purple-400" />;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return <FileText className="w-8 h-8 text-green-400" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  return (
    <LayoutScopeRoot routeActive="storage">
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0d0d16]">
        {/* SIDEBAR: Collections */}
        <div className="w-64 bg-[#12121f] border-r border-gray-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Storage Collections
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingCollections ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Carregando...
              </div>
            ) : collections.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma coleção encontrada
              </div>
            ) : (
              collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedCollectionId(col.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    selectedCollectionId === col.id
                      ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                      : "text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200"
                  }`}
                >
                  <Folder
                    className={`w-5 h-5 ${selectedCollectionId === col.id ? "text-blue-500" : "text-gray-500"}`}
                  />
                  <div className="truncate flex-1 font-medium">{col.name}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Header */}
          <header className="h-16 shrink-0 border-b border-gray-800 bg-[#12121f]/80 backdrop-blur-md flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-100">
                {collections.find((c) => c.id === selectedCollectionId)?.name ||
                  "Media Library"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar arquivos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-[#1a1a2e] border border-gray-800 rounded-md text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors w-64"
                />
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedCollectionId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </header>

          {/* Grid View & Dropzone */}
          <div
            className={`flex-1 overflow-y-auto p-6 relative transition-colors ${isDragOver ? "bg-blue-500/5" : "bg-transparent"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragOver && (
              <div className="absolute inset-4 rounded-xl border-2 border-dashed border-blue-500 bg-blue-500/10 z-10 flex items-center justify-center">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold text-blue-300">
                    Solte os arquivos aqui
                  </h3>
                  <p className="text-blue-400/80 mt-2">
                    Para enviá-los para esta coleção
                  </p>
                </div>
              </div>
            )}

            {!selectedCollectionId ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Folder className="w-16 h-16 mb-4 text-gray-600" />
                <p>
                  Selecione uma coleção no menu lateral para visualizar ou
                  gerenciar arquivos.
                </p>
              </div>
            ) : isLoadingAssets ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : assets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="p-4 bg-[#1a1a2e] rounded-full mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">
                  Coleção vazia
                </h3>
                <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
                  Arraste e solte arquivos aqui ou clique no botão Upload para
                  adicionar mídia a esta coleção.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => openEditModal(asset)}
                    className="group relative bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-square bg-[#0d0d16] flex flex-col items-center justify-center relative p-2">
                      {asset.mime_type.startsWith("image/") ? (
                        <img
                          src={asset.url}
                          alt={asset.alt_text || asset.filename}
                          className="w-full h-full object-cover rounded-md"
                          loading="lazy"
                        />
                      ) : (
                        renderAssetIcon(asset.mime_type)
                      )}

                      {/* Overlay info on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white shadow-sm border border-white/10">
                          Ver Detalhes
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#12121f] border-t border-gray-800">
                      <p
                        className="text-sm font-medium text-gray-300 truncate"
                        title={asset.filename}
                      >
                        {asset.filename}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 uppercase">
                        {asset.mime_type.split("/")[1] || asset.mime_type} •{" "}
                        {formatBytes(asset.file_size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress Overlay (simple version) */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute bottom-6 right-6 bg-[#1a1a2e] border border-gray-700 p-4 rounded-xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  Fazendo upload...
                </p>
                <div className="w-48 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ASSET DETAILS MODAL */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="bg-[#12121f] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: Preview */}
            <div className="w-full md:w-3/5 bg-[#0d0d16] border-b md:border-b-0 md:border-r border-gray-800 p-6 flex items-center justify-center relative">
              <button
                onClick={() => setSelectedAsset(null)}
                className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedAsset.mime_type.startsWith("image/") ? (
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.alt_text || selectedAsset.filename}
                  className="max-w-full max-h-full object-contain rounded-lg drop-shadow-lg"
                />
              ) : selectedAsset.mime_type.startsWith("video/") ? (
                <video controls className="max-w-full max-h-full rounded-lg">
                  <source
                    src={selectedAsset.url}
                    type={selectedAsset.mime_type}
                  />
                  Seu navegador não suporta a visualização desse vídeo.
                </video>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  {renderAssetIcon(selectedAsset.mime_type)}
                  <span className="mt-4 font-medium text-lg">
                    Visualização não suportada
                  </span>
                  <a
                    href={selectedAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-blue-500 hover:text-blue-400 text-sm underline"
                  >
                    Abrir arquivo original
                  </a>
                </div>
              )}
            </div>

            {/* Right side: Info & Actions */}
            <div className="w-full md:w-2/5 flex flex-col h-full max-h-[40vh] md:max-h-none overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-[#12121f] z-10">
                <h3 className="font-semibold text-gray-100">
                  Detalhes do Arquivo
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1a1a2e] rounded-md transition-colors hidden md:block"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6 flex-1">
                {/* Atributos */}
                <div className="space-y-3 p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">
                      Nome Original
                    </span>
                    <p className="text-sm font-medium text-gray-300 break-all">
                      {selectedAsset.filename}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Tamanho
                      </span>
                      <p className="text-sm text-gray-300">
                        {formatBytes(selectedAsset.file_size)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Tipo MIME
                      </span>
                      <p className="text-sm text-gray-300 uppercase">
                        {selectedAsset.mime_type.split("/")[1]}
                      </p>
                    </div>
                    {selectedAsset.width && selectedAsset.height && (
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 uppercase font-semibold">
                          Dimensões
                        </span>
                        <p className="text-sm text-gray-300">
                          {selectedAsset.width} × {selectedAsset.height} px
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Edits */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-200">
                      Metadados
                    </h4>
                    {!isEditingMetadata ? (
                      <button
                        onClick={() => setIsEditingMetadata(true)}
                        className="text-xs flex items-center text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Editar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingMetadata(false)}
                          className="text-xs text-gray-400 hover:text-gray-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleUpdateMetadata}
                          className="text-xs flex items-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        >
                          <Check className="w-3 h-3 mr-1" /> Salvar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium">
                      Texto Alternativo (Alt Text)
                    </label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editAltText}
                        onChange={(e) => setEditAltText(e.target.value)}
                        placeholder="Descreva a imagem para acessibilidade..."
                        className="w-full px-3 py-2 bg-[#0d0d16] border border-blue-500/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-gray-300 bg-[#0d0d16] p-3 rounded-lg border border-gray-800 min-h-[42px]">
                        {selectedAsset.alt_text || (
                          <span className="text-gray-600 italic">
                            Sem descrição (Alt Text)
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium">
                      URL do Arquivo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={selectedAsset.url}
                        className="flex-1 px-3 py-2 bg-[#0d0d16] border border-gray-800 rounded-lg text-xs text-gray-400 focus:outline-none"
                      />
                      <Button
                        onClick={() =>
                          navigator.clipboard.writeText(selectedAsset.url)
                        }
                        variant="outline"
                        size="sm"
                        className="bg-[#1a1a2e] border-gray-700 hover:bg-[#25253e] hover:text-white h-auto py-2"
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Zone */}
              <div className="p-5 border-t border-gray-800 bg-[#12121f]">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-red-900/50 bg-red-900/10 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-400/90 leading-relaxed">
                    Avisos de uso: Deletar este arquivo fará com que qualquer
                    artigo ou bloco que o use perca sua referência visual.
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(selectedAsset.id)}
                  className="w-full bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white transition-colors h-11"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Excluir Arquivo Definitivamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LayoutScopeRoot>
  );
}
