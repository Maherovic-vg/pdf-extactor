import { useState } from "react";

export default function PageSelector({ onExtract }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onExtract(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter pages (e.g. 1,3,5)"
        className="border rounded-lg p-2 w-64"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
      >
        Extract
      </button>
    </form>
  );
}
