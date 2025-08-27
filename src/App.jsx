import React, { useState, useEffect } from "react";

export default function App() {
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [order, setOrder] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showAllPages, setShowAllPages] = useState(true);
  const [pageIndexes, setPageIndexes] = useState("");

  useEffect(() => {
    if (window.pdfjsLib) return setPdfJsLoaded(true);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfJsLoaded(true);
    };
    script.onerror = () => alert("Failed to load PDF.js");
    document.head.appendChild(script);
  }, []);

  const loadPdfLib = () =>
    new Promise((resolve, reject) => {
      if (window.PDFLib) return resolve();
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PDF-lib"));
      document.head.appendChild(script);
    });

  const handleFileChange = async (e) => {
    if (!pdfJsLoaded) return alert("PDF.js is still loading, please wait...");
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return alert("Select a valid PDF file");

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        const pageImages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          pageImages.push({ id: String(i), src: canvas.toDataURL("image/png"), pageNumber: i });
        }
        setPages(pageImages);
        setPdfFile(file);
        setSelectedPages(new Set());
        setOrder([]);
        setShowAllPages(true);
      } catch (err) {
        console.error(err);
        alert("Error processing PDF");
      }
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const togglePageSelection = (pageId) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
      setOrder(order.filter((id) => id !== pageId));
    } else {
      newSelected.add(pageId);
      setOrder([...order, pageId]);
    }
    setSelectedPages(newSelected);
  };

  const proceedToReorder = () => {
    if (selectedPages.size === 0) return alert("Select at least one page");
    setShowAllPages(false);
  };

  const backToSelection = () => setShowAllPages(true);

  const handleDragStart = (e, id) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;
    const draggedIndex = order.indexOf(draggedItem);
    if (draggedIndex === targetIndex) return;
    const newOrder = [...order];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    setOrder(newOrder);
    setDragOverIndex(null);
  };

  const exportPdf = async () => {
    if (!pdfFile || selectedPages.size === 0) return;
    await loadPdfLib();
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const existingPdf = await window.PDFLib.PDFDocument.load(reader.result);
        const newPdf = await window.PDFLib.PDFDocument.create();
        for (const id of order) {
          const pageNumber = parseInt(id) - 1;
          const [copied] = await newPdf.copyPages(existingPdf, [pageNumber]);
          newPdf.addPage(copied);
        }
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "reordered.pdf";
        link.click();
      } catch (err) {
        console.error(err);
        alert("Failed to export PDF");
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  };

  const selectPagesByIndex = () => {
    const indexes = pageIndexes
      .split(",")
      .map((v) => parseInt(v.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= pages.length);
    if (indexes.length === 0) return alert("No valid page indexes");
    const newSelected = new Set(indexes.map((n) => String(n)));
    setSelectedPages(newSelected);
    setOrder([...newSelected]);
  };

  return (
    <div className="container">
      <style>{`
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .file-input { margin: 20px 0; text-align: center; }
        input[type=file] { display: none; }
        label.upload-btn { padding: 12px 24px; background-color: #007bff; color: white; border-radius: 6px; cursor: pointer; }
        label.upload-btn:hover { background-color: #0056b3; }
        .pages-grid { display: flex; flex-wrap: wrap; margin-top: 20px; gap: 10px; justify-content: center; }
        .page-card { position: relative; width: 120px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .page-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .page-card.selected { border: 3px solid #28a745; }
        .page-card img { width: 100%; display: block; }
        .page-number { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .buttons { display: flex; justify-content: center; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
        .btn { padding: 10px 18px; font-size: 14px; border-radius: 6px; cursor: pointer; border: none; font-weight: bold; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-primary:hover { background-color: #0056b3; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-success:hover { background-color: #218838; }
        .btn-secondary { background-color: #6c757d; color: white; }
        .btn-secondary:hover { background-color: #5a6268; }
        .processing { text-align: center; margin-top: 40px; font-size: 18px; color: #333; }
        .spin { display: inline-block; animation: spin 1s linear infinite; font-size: 48px; margin-bottom: 10px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <h1>PDF Page Reorder Tool</h1>

      <div className="file-input">
        <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} disabled={!pdfJsLoaded} />
        <label htmlFor="pdf-upload" className="upload-btn">Choose PDF</label>
      </div>

      {loading && <div className="processing"><span className="spin">📄</span><br/>Processing PDF...</div>}

      {pages.length > 0 && !loading && (
        <div>
          {showAllPages ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="Enter page indexes (e.g., 1,3,5)"
                  value={pageIndexes}
                  onChange={(e) => setPageIndexes(e.target.value)}
                  style={{ padding: "6px 10px", width: "250px", marginRight: "10px" }}
                />
                <button className="btn btn-primary"
                  onClick={selectPagesByIndex}
                >
                  Select Pages
                </button>
              </div>

              <div className="pages-grid">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`page-card ${selectedPages.has(page.id) ? "selected" : ""}`}
                    onClick={() => togglePageSelection(page.id)}
                  >
                    <div className="page-number">{page.pageNumber}</div>
                    <img src={page.src} alt={`Page ${page.pageNumber}`} />
                  </div>
                ))}
              </div>

              <div className="buttons">
                <button
                  className="btn btn-primary"
                  onClick={proceedToReorder}
                  disabled={selectedPages.size === 0}
                >
                  Proceed to Reorder ({selectedPages.size})
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setSelectedPages(new Set()); setOrder([]); }}
                >
                  Reset Selection
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="pages-grid">
                {order.map((id, index) => {
                  const page = pages.find((p) => p.id === id);
                  return (
                    <div
                      key={id}
                      className="page-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      style={dragOverIndex === index ? { transform: "scale(1.05)", boxShadow: "0 0 0 3px #007bff" } : {}}
                    >
                      <div className="page-number">{index + 1}</div>
                      <img src={page.src} alt={`Page ${page.pageNumber}`} />
                    </div>
                  );
                })}
              </div>

              <div className="buttons">
                <button className="btn btn-secondary" onClick={backToSelection}>← Back to Selection</button>
                <button className="btn btn-success" onClick={exportPdf}>Export PDF ({selectedPages.size} pages)</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
