import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';

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

  if (loading) return <div>Loading documents...</div>;
  if (documents.length === 0) return <div>No documents uploaded</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{doc.documentType}</div>
                  <div className="text-sm text-muted-foreground">
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
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
