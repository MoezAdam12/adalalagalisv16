import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsultationService } from '../services/consultation.service';
import { 
  Consultation, 
  ConsultationStatus, 
  ConsultationType,
  ConsultationMode,
  ConsultationPriority,
  ConsultationFeedback
} from '../models/consultation.model';
import { environment } from 'src/environments/environment';

describe('ConsultationService', () => {
  let service: ConsultationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsultationService]
    });
    service = TestBed.inject(ConsultationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all consultations', () => {
    const mockConsultations: Consultation[] = [
      {
        id: '1',
        title: 'Initial Legal Consultation',
        clientId: 'client1',
        clientName: 'John Doe',
        attorneyId: 'attorney1',
        attorneyName: 'Jane Smith',
        type: ConsultationType.INITIAL,
        status: ConsultationStatus.SCHEDULED,
        mode: ConsultationMode.IN_PERSON,
        priority: ConsultationPriority.MEDIUM,
        scheduledDate: new Date(Date.now() + 86400000), // tomorrow
        duration: 60, // minutes
        location: 'Office 101',
        description: 'Initial consultation for contract review',
        notes: [],
        attachments: [],
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Follow-up Consultation',
        clientId: 'client2',
        clientName: 'Sarah Johnson',
        attorneyId: 'attorney2',
        attorneyName: 'Michael Brown',
        type: ConsultationType.FOLLOW_UP,
        status: ConsultationStatus.COMPLETED,
        mode: ConsultationMode.VIRTUAL,
        priority: ConsultationPriority.HIGH,
        scheduledDate: new Date(Date.now() - 86400000), // yesterday
        duration: 45, // minutes
        location: 'Zoom Meeting',
        description: 'Follow-up on previous legal advice',
        notes: [],
        attachments: [],
        createdBy: 'user2',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000) // yesterday
      }
    ];

    service.getAllConsultations().subscribe(consultations => {
      expect(consultations.length).toBe(2);
      expect(consultations).toEqual(mockConsultations);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConsultations);
  });

  it('should get consultation by id', () => {
    const mockConsultation: Consultation = {
      id: '1',
      title: 'Initial Legal Consultation',
      clientId: 'client1',
      clientName: 'John Doe',
      attorneyId: 'attorney1',
      attorneyName: 'Jane Smith',
      type: ConsultationType.INITIAL,
      status: ConsultationStatus.SCHEDULED,
      mode: ConsultationMode.IN_PERSON,
      priority: ConsultationPriority.MEDIUM,
      scheduledDate: new Date(Date.now() + 86400000), // tomorrow
      duration: 60, // minutes
      location: 'Office 101',
      description: 'Initial consultation for contract review',
      notes: [],
      attachments: [],
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.getConsultationById('1').subscribe(consultation => {
      expect(consultation).toEqual(mockConsultation);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConsultation);
  });

  it('should create consultation', () => {
    const mockConsultation: Consultation = {
      id: '1',
      title: 'Initial Legal Consultation',
      clientId: 'client1',
      clientName: 'John Doe',
      attorneyId: 'attorney1',
      attorneyName: 'Jane Smith',
      type: ConsultationType.INITIAL,
      status: ConsultationStatus.SCHEDULED,
      mode: ConsultationMode.IN_PERSON,
      priority: ConsultationPriority.MEDIUM,
      scheduledDate: new Date(Date.now() + 86400000), // tomorrow
      duration: 60, // minutes
      location: 'Office 101',
      description: 'Initial consultation for contract review',
      notes: [],
      attachments: [],
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.createConsultation(mockConsultation).subscribe(consultation => {
      expect(consultation).toEqual(mockConsultation);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockConsultation);
    req.flush(mockConsultation);
  });

  it('should update consultation', () => {
    const mockConsultation: Consultation = {
      id: '1',
      title: 'Updated Legal Consultation',
      clientId: 'client1',
      clientName: 'John Doe',
      attorneyId: 'attorney2',
      attorneyName: 'Michael Brown',
      type: ConsultationType.INITIAL,
      status: ConsultationStatus.RESCHEDULED,
      mode: ConsultationMode.IN_PERSON,
      priority: ConsultationPriority.HIGH,
      scheduledDate: new Date(Date.now() + 172800000), // day after tomorrow
      duration: 90, // minutes
      location: 'Office 202',
      description: 'Rescheduled initial consultation for contract review',
      notes: [],
      attachments: [],
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.updateConsultation('1', mockConsultation).subscribe(consultation => {
      expect(consultation).toEqual(mockConsultation);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockConsultation);
    req.flush(mockConsultation);
  });

  it('should delete consultation', () => {
    service.deleteConsultation('1').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should update consultation status', () => {
    const statusRequest = {
      status: ConsultationStatus.IN_PROGRESS
    };

    service.updateConsultationStatus('1', ConsultationStatus.IN_PROGRESS).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(statusRequest);
    req.flush({});
  });

  it('should add note to consultation', () => {
    const mockNote = {
      id: 'note1',
      consultationId: '1',
      text: 'Test note',
      isPrivate: false,
      createdBy: 'user1',
      createdAt: new Date()
    };

    const noteRequest = {
      text: 'Test note',
      isPrivate: false
    };

    service.addNote('1', noteRequest).subscribe(note => {
      expect(note).toEqual(mockNote);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/notes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(noteRequest);
    req.flush(mockNote);
  });

  it('should get consultation notes', () => {
    const mockNotes = [
      {
        id: 'note1',
        consultationId: '1',
        text: 'Test note 1',
        isPrivate: false,
        createdBy: 'user1',
        createdAt: new Date(Date.now() - 86400000) // yesterday
      },
      {
        id: 'note2',
        consultationId: '1',
        text: 'Test note 2',
        isPrivate: true,
        createdBy: 'user2',
        createdAt: new Date()
      }
    ];

    service.getConsultationNotes('1').subscribe(notes => {
      expect(notes.length).toBe(2);
      expect(notes).toEqual(mockNotes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/notes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotes);
  });

  it('should add attachment to consultation', () => {
    const mockAttachment = {
      id: 'attachment1',
      consultationId: '1',
      name: 'Test Document.pdf',
      fileUrl: 'http://example.com/test.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      description: 'Test attachment',
      isPrivate: false,
      uploadedBy: 'user1',
      uploadedAt: new Date()
    };

    const attachmentRequest = {
      name: 'Test Document.pdf',
      fileUrl: 'http://example.com/test.pdf',
      fileSize: 1024,
      fileType: 'application/pdf',
      description: 'Test attachment',
      isPrivate: false
    };

    service.addAttachment('1', attachmentRequest).subscribe(attachment => {
      expect(attachment).toEqual(mockAttachment);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/attachments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(attachmentRequest);
    req.flush(mockAttachment);
  });

  it('should get consultation attachments', () => {
    const mockAttachments = [
      {
        id: 'attachment1',
        consultationId: '1',
        name: 'Test Document 1.pdf',
        fileUrl: 'http://example.com/test1.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        description: 'Test attachment 1',
        isPrivate: false,
        uploadedBy: 'user1',
        uploadedAt: new Date(Date.now() - 86400000) // yesterday
      },
      {
        id: 'attachment2',
        consultationId: '1',
        name: 'Test Document 2.docx',
        fileUrl: 'http://example.com/test2.docx',
        fileSize: 2048,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        description: 'Test attachment 2',
        isPrivate: true,
        uploadedBy: 'user2',
        uploadedAt: new Date()
      }
    ];

    service.getConsultationAttachments('1').subscribe(attachments => {
      expect(attachments.length).toBe(2);
      expect(attachments).toEqual(mockAttachments);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/attachments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAttachments);
  });

  it('should submit feedback', () => {
    const mockFeedback: ConsultationFeedback = {
      id: 'feedback1',
      consultationId: '1',
      rating: 4,
      comments: 'Great consultation, very helpful!',
      submittedBy: 'client1',
      submittedAt: new Date()
    };

    const feedbackRequest = {
      rating: 4,
      comments: 'Great consultation, very helpful!',
      submittedBy: 'client1'
    };

    service.submitFeedback('1', feedbackRequest).subscribe(feedback => {
      expect(feedback).toEqual(mockFeedback);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/feedback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(feedbackRequest);
    req.flush(mockFeedback);
  });

  it('should get consultation feedback', () => {
    const mockFeedback = [
      {
        id: 'feedback1',
        consultationId: '1',
        rating: 4,
        comments: 'Great consultation, very helpful!',
        submittedBy: 'client1',
        submittedAt: new Date()
      }
    ];

    service.getConsultationFeedback('1').subscribe(feedback => {
      expect(feedback.length).toBe(1);
      expect(feedback).toEqual(mockFeedback);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations/1/feedback`);
    expect(req.request.method).toBe('GET');
    req.flush(mockFeedback);
  });

  it('should get consultations by status', () => {
    const mockConsultations: Consultation[] = [
      {
        id: '1',
        title: 'Initial Legal Consultation',
        clientId: 'client1',
        clientName: 'John Doe',
        attorneyId: 'attorney1',
        attorneyName: 'Jane Smith',
        type: ConsultationType.INITIAL,
        status: ConsultationStatus.SCHEDULED,
        mode: ConsultationMode.IN_PERSON,
        priority: ConsultationPriority.MEDIUM,
        scheduledDate: new Date(Date.now() + 86400000), // tomorrow
        duration: 60, // minutes
        location: 'Office 101',
        description: 'Initial consultation for contract review',
        notes: [],
        attachments: [],
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Contract Review Consultation',
        clientId: 'client3',
        clientName: 'Robert Wilson',
        attorneyId: 'attorney1',
        attorneyName: 'Jane Smith',
        type: ConsultationType.CONTRACT_REVIEW,
        status: ConsultationStatus.SCHEDULED,
        mode: ConsultationMode.IN_PERSON,
        priority: ConsultationPriority.HIGH,
        scheduledDate: new Date(Date.now() + 172800000), // day after tomorrow
        duration: 90, // minutes
        location: 'Office 101',
        description: 'Review of employment contract',
        notes: [],
        attachments: [],
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    service.getConsultationsByStatus(ConsultationStatus.SCHEDULED).subscribe(consultations => {
      expect(consultations.length).toBe(2);
      expect(consultations).toEqual(mockConsultations);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations?status=${ConsultationStatus.SCHEDULED}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConsultations);
  });

  it('should get consultations by attorney', () => {
    const mockConsultations: Consultation[] = [
      {
        id: '1',
        title: 'Initial Legal Consultation',
        clientId: 'client1',
        clientName: 'John Doe',
        attorneyId: 'attorney1',
        attorneyName: 'Jane Smith',
        type: ConsultationType.INITIAL,
        status: ConsultationStatus.SCHEDULED,
        mode: ConsultationMode.IN_PERSON,
        priority: ConsultationPriority.MEDIUM,
        scheduledDate: new Date(Date.now() + 86400000), // tomorrow
        duration: 60, // minutes
        location: 'Office 101',
        description: 'Initial consultation for contract review',
        notes: [],
        attachments: [],
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Contract Review Consultation',
        clientId: 'client3',
        clientName: 'Robert Wilson',
        attorneyId: 'attorney1',
        attorneyName: 'Jane Smith',
        type: ConsultationType.CONTRACT_REVIEW,
        status: ConsultationStatus.SCHEDULED,
        mode: ConsultationMode.IN_PERSON,
        priority: ConsultationPriority.HIGH,
        scheduledDate: new Date(Date.now() + 172800000), // day after tomorrow
        duration: 90, // minutes
        location: 'Office 101',
        description: 'Review of employment contract',
        notes: [],
        attachments: [],
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    service.getConsultationsByAttorney('attorney1').subscribe(consultations => {
      expect(consultations.length).toBe(2);
      expect(consultations).toEqual(mockConsultations);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/consultations?attorneyId=attorney1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConsultations);
  });
});
