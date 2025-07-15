import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { state, login, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    if (state.error) {
      clearError();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#333', fontSize: '2rem' }}>
            WMS System
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Warehouse Management System
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {state.error && (
            <Message 
              severity="error" 
              text={state.error}
              style={{ marginBottom: '1rem' }}
            />
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Username
            </label>
            <InputText
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                handleInputChange();
              }}
              placeholder="Enter your username"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Password
            </label>
            <Password
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleInputChange();
              }}
              placeholder="Enter your password"
              style={{ width: '100%' }}
              required
              feedback={false}
            />
          </div>

          <Button
            type="submit"
            label={isLoading ? 'Signing In...' : 'Sign In'}
            icon={isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-sign-in'}
            style={{ width: '100%' }}
            loading={isLoading}
            disabled={isLoading}
          />
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
            Demo Credentials: admin / admin
          </p>
        </div>
      </Card>
    </div>
  );
}; 