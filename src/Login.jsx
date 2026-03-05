import React, { useState } from 'react';
import { Database } from 'lucide-react';
import CustomDropdown from './components/atomic/Customdropdown';
import { loginUser, registerUser } from './integration/api';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Registration flow
        if (!email || !username || !password) {
          throw new Error('Please enter all required fields for registration');
        }
        const userData = {
          username,
          password,
          email,
          role
        };
        await registerUser(userData);
        setError('Registration successful! Please log in.');
        setIsRegister(false);
      } else {
        // Login flow
        if (!username || !password) {
          throw new Error('Please enter both username and password');
        }
        const credentials = { username, password };
        const result = await loginUser(credentials);
        // Extract user data from login response
        const userData = {
          name: result.user_name || credentials.username,
          email: result.user_id || email,
          username: credentials.username
        };
        onLogin(userData);
      }
    } catch (err) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-amber-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Database className="text-white" size={40} strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">KnowledgeHub</h1>
          <p className="text-gray-600 text-lg">Enterprise Knowledge Base</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg p-10 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Enter your credentials to access your knowledge base</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-800 text-gray-900 placeholder-gray-400"
                placeholder="Enter your username"
                required={true}
              />
            </div>
            
            {isRegister && (
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-800 text-gray-900 placeholder-gray-400"
                  placeholder="name@company.com"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-800 text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
              />
            </div>
            
            {isRegister && (
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-900 mb-2">
                  Role
                </label>
                <CustomDropdown
                  value={role}
                  onChange={setRole}
                  options={roleOptions}
                  placeholder="Select role"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold py-4 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-800 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isRegister ? 'Registering...' : 'Signing in...'}
                </span>
              ) : (
                isRegister ? 'Sign Up' : 'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-amber-800 hover:text-amber-900 font-medium text-sm"
            >
              {isRegister 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2026 KnowledgeHub. Enterprise-grade knowledge management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;