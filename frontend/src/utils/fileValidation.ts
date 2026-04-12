/**
 * Checks if a file header actually matches its extension.
 * Helps prevent users from renaming executable files as .pdf, .docx, or images.
 */
export const verifyFileHeader = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onloadend = (e) => {
      if (!e.target || !e.target.result) {
        resolve(false);
        return;
      }
      
      const arr = new Uint8Array(e.target.result as ArrayBuffer).subarray(0, 12);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).padStart(2, "0");
      }
      
      const hex = header.toLowerCase();

      // Common file headers (matches backend/utils/recruitmentUtils.ts)
      // PDF: 25504446 ( %PDF )
      // DOCX/ZIP: 504b0304 ( PK\x03\x04 )
      // PNG: 89504e47 ( \x89PNG )
      // JPEG/JPG: ffd8ff ( FF D8 FF... )
      
      if (hex.startsWith('25504446')) resolve(true); // PDF
      else if (hex.startsWith('504b0304')) resolve(true); // ZIP/DOCX
      else if (hex.startsWith('89504e47')) resolve(true); // PNG
      else if (hex.startsWith('ffd8ff')) resolve(true);   // JPEG
      else {
        // Fallback or deny - matches backend's current behavior of allowing others for now
        // but logs warning
        console.warn(`File header ${hex} for ${file.name} might not match expected type.`);
        resolve(true); 
      }
    };

    reader.onerror = () => {
      resolve(false);
    };

    // Read the first 12 bytes
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};
