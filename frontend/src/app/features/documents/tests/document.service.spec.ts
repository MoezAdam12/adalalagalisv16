import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from '../services/document.service';
import { Document, DocumentType, DocumentStatus } from '../models/document.model';
import { environment } from 'src/environments/environment';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentService]
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all documents', () => {
    const mockDocuments: Document[] = [
      {
        id: '1',
        title: 'Test Document 1',
        description: 'Test Description 1',
        type: DocumentType.CONTRACT,
        status: DocumentStatus.ACTIVE,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        fileUrl: 'http://example.com/doc1.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        tags: ['contract', 'test'],
        version: 1,
        isPrivate: false
      },
      {
        id: '2',
        title: 'Test Document 2',
        description: 'Test Description 2',
        type: DocumentType.LEGAL_OPINION,
        status: DocumentStatus.DRAFT,
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        fileUrl: 'http://example.com/doc2.pdf',
        fileSize: 2048,
        fileType: 'application/pdf',
        tags: ['opinion', 'test'],
        version: 1,
        isPrivate: true
      }
    ];

    service.getAllDocuments().subscribe(documents => {
      expect(documents.length).toBe(2);
      expect(documents).toEqual(mockDocuments);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDocuments);
  });

  it('should get document by id', () => {
    const mockDocument: Document = {
      id: '1',
      title: 'Test Document 1',
      description: 'Test Description 1',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.ACTIVE,
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      fileUrl: 'http://example.com/doc1.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      tags: ['contract', 'test'],
      version: 1,
      isPrivate: false
    };

    service.getDocumentById('1').subscribe(document => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDocument);
  });

  it('should create document', () => {
    const mockDocument: Document = {
      id: '1',
      title: 'Test Document 1',
      description: 'Test Description 1',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.ACTIVE,
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      fileUrl: 'http://example.com/doc1.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      tags: ['contract', 'test'],
      version: 1,
      isPrivate: false
    };

    service.createDocument(mockDocument).subscribe(document => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockDocument);
    req.flush(mockDocument);
  });

  it('should update document', () => {
    const mockDocument: Document = {
      id: '1',
      title: 'Updated Document 1',
      description: 'Updated Description 1',
      type: DocumentType.CONTRACT,
      status: DocumentStatus.ACTIVE,
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      fileUrl: 'http://example.com/doc1.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      tags: ['contract', 'test', 'updated'],
      version: 2,
      isPrivate: false
    };

    service.updateDocument('1', mockDocument).subscribe(document => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockDocument);
    req.flush(mockDocument);
  });

  it('should delete document', () => {
    service.deleteDocument('1').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should share document', () => {
    const mockShareResponse = {
      documentId: '1',
      shareUrl: 'http://example.com/share/abc123',
      expiresAt: new Date(Date.now() + 86400000) // 24 hours from now
    };

    service.shareDocument('1', { expiresIn: 86400 }).subscribe(response => {
      expect(response).toEqual(mockShareResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/1/share`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ expiresIn: 86400 });
    req.flush(mockShareResponse);
  });

  it('should get document versions', () => {
    const mockVersions = [
      {
        id: '1-v1',
        documentId: '1',
        version: 1,
        createdBy: 'user1',
        createdAt: new Date(Date.now() - 86400000), // 24 hours ago
        fileUrl: 'http://example.com/doc1-v1.pdf'
      },
      {
        id: '1-v2',
        documentId: '1',
        version: 2,
        createdBy: 'user1',
        createdAt: new Date(),
        fileUrl: 'http://example.com/doc1-v2.pdf'
      }
    ];

    service.getDocumentVersions('1').subscribe(versions => {
      expect(versions.length).toBe(2);
      expect(versions).toEqual(mockVersions);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/1/versions`);
    expect(req.request.method).toBe('GET');
    req.flush(mockVersions);
  });

  it('should analyze document', () => {
    const mockAnalysisResult = {
      documentId: '1',
      documentType: 'contract',
      entities: {
        people: ['John Doe', 'Jane Smith'],
        organizations: ['Acme Corp', 'Legal Services LLC'],
        locations: ['Riyadh', 'Saudi Arabia'],
        dates: ['January 15, 2025', 'March 30, 2026'],
        monetary_values: ['$50,000', 'SAR 185,000']
      },
      summary: 'This is a service agreement between Acme Corp and Legal Services LLC.',
      risk_score: 0.35
    };

    service.analyzeDocument('1').subscribe(result => {
      expect(result).toEqual(mockAnalysisResult);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/1/analyze`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAnalysisResult);
  });
});
