import { useEffect, useState } from 'react';

interface ApplicantDocument {
  id: number;
  documentName: string;
  documentType: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string;
  fileSizeKB: string;
}

interface Props {
  applicantId: number;
}

export const ApplicantDocumentList = ({ applicantId }: Props) => {
  const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recruitment/applicants/${applicantId}/documents`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDocuments(data.documents);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [applicantId]);

  if (loading) return <div className="p-4">Loading documents...</div>;
  if (documents.length === 0) return <div className="p-4 text-gray-500">No documents uploaded</div>;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="text-lg font-semibold">Uploaded Documents</h3>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium">{doc.documentType}</div>
                  <div className="text-sm text-gray-500">
                    {doc.documentName} ({doc.fileSizeKB} KB)
                  </div>
                </div>
              </div>
              <a
                href={doc.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
