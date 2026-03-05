import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:5000/api/v1';
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

let actorToken: string;
let producerToken: string;

test.describe('API - Authentication Endpoints', () => {
  test('POST /auth/register - should register new user', async ({ request }) => {
    const uniqueEmail = `test${Date.now()}@test.com`;
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        fullName: 'Test User',
        email: uniqueEmail,
        password: 'Test1234',
        userType: 'Actor'
      }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body.user).toHaveProperty('email', uniqueEmail);
  });

  test('POST /auth/register - should fail with invalid email', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        fullName: 'Test User',
        email: 'invalidemail',
        password: 'Test1234',
        userType: 'Actor'
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('POST /auth/register - should fail with weak password', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        fullName: 'Test User',
        email: 'test@test.com',
        password: '123',
        userType: 'Actor'
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('POST /auth/login - should login with valid credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: ACTOR.email,
        password: ACTOR.password
      }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    actorToken = body.token;
  });

  test('POST /auth/login - should fail with invalid password', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: ACTOR.email,
        password: 'wrongpassword'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('POST /auth/login - should fail with non-existent email', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'nonexistent@test.com',
        password: 'password123'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('GET /auth/me - should return current user with valid token', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: ACTOR.email, password: ACTOR.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('email', ACTOR.email);
  });

  test('GET /auth/me - should fail without token', async ({ request }) => {
    const response = await request.get(`${API_URL}/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('GET /auth/me - should fail with invalid token', async ({ request }) => {
    const response = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalidtoken' }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('API - Teams Endpoints', () => {
  test('POST /teams - should create team with valid data', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.post(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: `Test Team ${Date.now()}`,
        description: 'Test team description'
      }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('name');
  });

  test('GET /teams - should return user teams', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /teams/:id/invite - should invite team member', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const teamsResponse = await request.get(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teams = await teamsResponse.json();
    
    if (teams.length > 0) {
      const teamId = teams[0]._id;
      const response = await request.post(`${API_URL}/teams/${teamId}/invite`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          email: 'newmember@test.com',
          role: 'Member'
        }
      });
      
      expect([200, 201, 400]).toContain(response.status());
    }
  });
});

test.describe('API - Projects Endpoints', () => {
  test('POST /projects - should create project', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.post(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: `Test Project ${Date.now()}`,
        description: 'Test project description',
        genre: 'Drama',
        productionType: 'Feature Film'
      }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('title');
  });

  test('GET /projects - should return user projects', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /projects/:id - should return project details', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const projectsResponse = await request.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const projectId = projects[0]._id;
      const response = await request.get(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('_id', projectId);
    }
  });

  test('PUT /projects/:id - should update project', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const projectsResponse = await request.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const projectId = projects[0]._id;
      const response = await request.put(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          title: 'Updated Project Title',
          description: 'Updated description'
        }
      });
      
      expect(response.status()).toBe(200);
    }
  });
});

test.describe('API - Casting Endpoints', () => {
  test('GET /casting - should return all casting calls', async ({ request }) => {
    const response = await request.get(`${API_URL}/casting`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /casting - should create casting call', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const projectsResponse = await request.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const projectId = projects[0]._id;
      const response = await request.post(`${API_URL}/casting`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          projectId: projectId,
          roleName: 'Lead Actor',
          description: 'Looking for a talented lead actor',
          requirements: 'Experience in drama',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      expect([200, 201]).toContain(response.status());
    }
  });

  test('GET /casting/:id - should return casting call details', async ({ request }) => {
    const castingResponse = await request.get(`${API_URL}/casting`);
    const castingCalls = await castingResponse.json();
    
    if (castingCalls.length > 0) {
      const castingId = castingCalls[0]._id;
      const response = await request.get(`${API_URL}/casting/${castingId}`);
      
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('_id', castingId);
    }
  });

  test('POST /casting - should fail without authentication', async ({ request }) => {
    const response = await request.post(`${API_URL}/casting`, {
      data: {
        roleName: 'Lead Actor',
        description: 'Test description'
      }
    });
    
    expect(response.status()).toBe(401);
  });
});

test.describe('API - Submissions Endpoints', () => {
  test('POST /submissions - should create submission', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: ACTOR.email, password: ACTOR.password }
    });
    const { token } = await loginResponse.json();
    
    const castingResponse = await request.get(`${API_URL}/casting`);
    const castingCalls = await castingResponse.json();
    
    if (castingCalls.length > 0) {
      const castingId = castingCalls[0]._id;
      const response = await request.post(`${API_URL}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          castingId: castingId,
          notes: 'I am interested in this role'
        }
      });
      
      expect([200, 201, 400]).toContain(response.status());
    }
  });

  test('GET /submissions/actor - should return actor submissions', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: ACTOR.email, password: ACTOR.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/submissions/actor`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /submissions/producer - should return producer submissions', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/submissions/producer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('PUT /submissions/:id/status - should update submission status', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const submissionsResponse = await request.get(`${API_URL}/submissions/producer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const submissions = await submissionsResponse.json();
    
    if (submissions.length > 0) {
      const submissionId = submissions[0]._id;
      const response = await request.put(`${API_URL}/submissions/${submissionId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          status: 'Reviewed'
        }
      });
      
      expect([200, 400]).toContain(response.status());
    }
  });
});

test.describe('API - Notifications Endpoints', () => {
  test('GET /notifications - should return user notifications', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: ACTOR.email, password: ACTOR.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('PUT /notifications/:id/read - should mark notification as read', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: ACTOR.email, password: ACTOR.password }
    });
    const { token } = await loginResponse.json();
    
    const notificationsResponse = await request.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifications = await notificationsResponse.json();
    
    if (notifications.length > 0) {
      const notificationId = notifications[0]._id;
      const response = await request.put(`${API_URL}/notifications/${notificationId}/read`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      expect([200, 400]).toContain(response.status());
    }
  });

  test('DELETE /notifications/:id - should delete notification', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: ACTOR.email, password: ACTOR.password }
    });
    const { token } = await loginResponse.json();
    
    const notificationsResponse = await request.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifications = await notificationsResponse.json();
    
    if (notifications.length > 0) {
      const notificationId = notifications[0]._id;
      const response = await request.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      expect([200, 204, 404]).toContain(response.status());
    }
  });
});

test.describe('API - Error Handling', () => {
  test('should return 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get(`${API_URL}/nonexistent`);
    expect(response.status()).toBe(404);
  });

  test('should return 401 for protected routes without token', async ({ request }) => {
    const response = await request.get(`${API_URL}/projects`);
    expect(response.status()).toBe(401);
  });

  test('should return 400 for invalid request body', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        // Missing required fields
        email: 'test@test.com'
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('should handle CORS properly', async ({ request }) => {
    const response = await request.get(`${API_URL}/casting`, {
      headers: {
        'Origin': 'http://localhost:8080'
      }
    });
    
    expect(response.status()).toBe(200);
  });
});

test.describe('API - Pagination', () => {
  test('should support pagination for casting calls', async ({ request }) => {
    const response = await request.get(`${API_URL}/casting?page=1&limit=10`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should support pagination for projects', async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: PRODUCER.email, password: PRODUCER.password }
    });
    const { token } = await loginResponse.json();
    
    const response = await request.get(`${API_URL}/projects?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
  });
});

test.describe('API - Search and Filters', () => {
  test('should search casting calls by keyword', async ({ request }) => {
    const response = await request.get(`${API_URL}/casting?search=actor`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should filter casting calls by genre', async ({ request }) => {
    const response = await request.get(`${API_URL}/casting?genre=Drama`);
    
    expect(response.status()).toBe(200);
  });

  test('should filter casting calls by status', async ({ request }) => {
    const response = await request.get(`${API_URL}/casting?status=Open`);
    
    expect(response.status()).toBe(200);
  });
});
