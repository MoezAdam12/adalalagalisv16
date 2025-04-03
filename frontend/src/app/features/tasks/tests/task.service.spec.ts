import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from '../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { environment } from 'src/environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all tasks', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Test Task 1',
        description: 'Test Description 1',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        assignedTo: 'user1',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        tags: ['legal', 'contract'],
        relatedDocuments: ['doc1'],
        comments: []
      },
      {
        id: '2',
        title: 'Test Task 2',
        description: 'Test Description 2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assignedTo: 'user3',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 172800000), // day after tomorrow
        tags: ['legal', 'review'],
        relatedDocuments: ['doc2'],
        comments: []
      }
    ];

    service.getAllTasks().subscribe(tasks => {
      expect(tasks.length).toBe(2);
      expect(tasks).toEqual(mockTasks);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('should get task by id', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Test Task 1',
      description: 'Test Description 1',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      assignedTo: 'user1',
      createdBy: 'user2',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      tags: ['legal', 'contract'],
      relatedDocuments: ['doc1'],
      comments: []
    };

    service.getTaskById('1').subscribe(task => {
      expect(task).toEqual(mockTask);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTask);
  });

  it('should create task', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Test Task 1',
      description: 'Test Description 1',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      assignedTo: 'user1',
      createdBy: 'user2',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      tags: ['legal', 'contract'],
      relatedDocuments: ['doc1'],
      comments: []
    };

    service.createTask(mockTask).subscribe(task => {
      expect(task).toEqual(mockTask);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockTask);
    req.flush(mockTask);
  });

  it('should update task', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Updated Task 1',
      description: 'Updated Description 1',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignedTo: 'user3',
      createdBy: 'user2',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      tags: ['legal', 'contract', 'updated'],
      relatedDocuments: ['doc1', 'doc3'],
      comments: []
    };

    service.updateTask('1', mockTask).subscribe(task => {
      expect(task).toEqual(mockTask);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockTask);
    req.flush(mockTask);
  });

  it('should delete task', () => {
    service.deleteTask('1').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should assign task', () => {
    const assignRequest = {
      assignedTo: 'user3'
    };

    service.assignTask('1', 'user3').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/assign`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(assignRequest);
    req.flush({});
  });

  it('should update task status', () => {
    const statusRequest = {
      status: TaskStatus.COMPLETED
    };

    service.updateTaskStatus('1', TaskStatus.COMPLETED).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(statusRequest);
    req.flush({});
  });

  it('should add comment to task', () => {
    const mockComment = {
      id: 'comment1',
      taskId: '1',
      text: 'Test comment',
      createdBy: 'user2',
      createdAt: new Date()
    };

    const commentRequest = {
      text: 'Test comment'
    };

    service.addComment('1', 'Test comment').subscribe(comment => {
      expect(comment).toEqual(mockComment);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(commentRequest);
    req.flush(mockComment);
  });

  it('should get task comments', () => {
    const mockComments = [
      {
        id: 'comment1',
        taskId: '1',
        text: 'Test comment 1',
        createdBy: 'user2',
        createdAt: new Date(Date.now() - 86400000) // yesterday
      },
      {
        id: 'comment2',
        taskId: '1',
        text: 'Test comment 2',
        createdBy: 'user3',
        createdAt: new Date()
      }
    ];

    service.getTaskComments('1').subscribe(comments => {
      expect(comments.length).toBe(2);
      expect(comments).toEqual(mockComments);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1/comments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockComments);
  });

  it('should get tasks by status', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Test Task 1',
        description: 'Test Description 1',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        assignedTo: 'user1',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        tags: ['legal', 'contract'],
        relatedDocuments: ['doc1'],
        comments: []
      },
      {
        id: '3',
        title: 'Test Task 3',
        description: 'Test Description 3',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.LOW,
        assignedTo: 'user4',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 259200000), // 3 days from now
        tags: ['legal', 'draft'],
        relatedDocuments: [],
        comments: []
      }
    ];

    service.getTasksByStatus(TaskStatus.IN_PROGRESS).subscribe(tasks => {
      expect(tasks.length).toBe(2);
      expect(tasks).toEqual(mockTasks);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks?status=${TaskStatus.IN_PROGRESS}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });
});
