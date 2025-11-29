const request = require('supertest');

// We need to import the app but we can't run it directly
// since it starts the server. This is a test implementation.

describe('Health Endpoint Tests', () => {
  const baseURL = process.env.TEST_API_URL || 'http://localhost:5001';

  describe('GET /health', () => {
    it('should return 200 OK status', async () => {
      const response = await request(baseURL).get('/health');
      
      expect(response.status).toBe(200);
    });

    it('should return valid JSON response', async () => {
      const response = await request(baseURL).get('/health');
      
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toBeDefined();
    });

    it('should include status field with "ok" value', async () => {
      const response = await request(baseURL).get('/health');
      
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(baseURL).get('/health');
      
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    it('should include services object with all required services', async () => {
      const response = await request(baseURL).get('/health');
      
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('firebase');
      expect(response.body.services).toHaveProperty('gitlab');
      expect(response.body.services).toHaveProperty('jira');
      expect(response.body.services).toHaveProperty('config');
    });

    it('should include configuration object with project and board counts', async () => {
      const response = await request(baseURL).get('/health');
      
      expect(response.body).toHaveProperty('configuration');
      expect(response.body.configuration).toHaveProperty('projects');
      expect(response.body.configuration).toHaveProperty('boards');
      expect(typeof response.body.configuration.projects).toBe('number');
      expect(typeof response.body.configuration.boards).toBe('number');
    });

    it('should indicate service configuration status', async () => {
      const response = await request(baseURL).get('/health');
      
      const validStatuses = ['configured', 'not configured', 'not available', 'loaded', 'missing'];
      
      expect(validStatuses).toContain(response.body.services.firebase);
      expect(validStatuses).toContain(response.body.services.gitlab);
      expect(validStatuses).toContain(response.body.services.jira);
      expect(validStatuses).toContain(response.body.services.config);
    });

    it('should complete health check in under 100ms', async () => {
      const startTime = Date.now();
      const response = await request(baseURL).get('/health');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });
  });
});
