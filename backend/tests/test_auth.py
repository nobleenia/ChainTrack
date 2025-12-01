"""
Authentication Route Tests
"""

import pytest


def test_register_success(client):
    """Test successful user registration"""
    response = client.post('/api/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'securepassword123',
        'name': 'New User',
        'role': 'manufacturer'
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['email'] == 'newuser@example.com'


def test_register_duplicate_email(client):
    """Test registration with existing email"""
    # First registration
    client.post('/api/auth/register', json={
        'email': 'duplicate@example.com',
        'password': 'password123',
        'name': 'First User'
    })
    
    # Second registration with same email
    response = client.post('/api/auth/register', json={
        'email': 'duplicate@example.com',
        'password': 'password456',
        'name': 'Second User'
    })
    
    assert response.status_code == 409


def test_login_success(client):
    """Test successful login"""
    # Register first
    client.post('/api/auth/register', json={
        'email': 'login@example.com',
        'password': 'password123',
        'name': 'Login User'
    })
    
    # Login
    response = client.post('/api/auth/login', json={
        'email': 'login@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data


def test_login_invalid_credentials(client):
    """Test login with wrong password"""
    # Register first
    client.post('/api/auth/register', json={
        'email': 'wrongpass@example.com',
        'password': 'correctpassword',
        'name': 'Test User'
    })
    
    # Login with wrong password
    response = client.post('/api/auth/login', json={
        'email': 'wrongpass@example.com',
        'password': 'wrongpassword'
    })
    
    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    """Test getting current user profile"""
    response = client.get('/api/auth/me', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'user' in data
