import { useDropzone } from "react-dropzone";

export default function FileUploader({ onFileSelect }) {
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "application/pdf": [] } });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-400 p-6 rounded-lg text-center cursor-pointer bg-white"
    >
      <input {...getInputProps()} />
      <p className="text-gray-600">Drag & drop a PDF here, or click to select</p>
    </div>
  );
}
