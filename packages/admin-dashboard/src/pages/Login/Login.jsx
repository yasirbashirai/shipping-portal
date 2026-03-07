import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import * as endpoints from '../../api/endpoints.js';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

/**
 * Admin login page
 */
export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await endpoints.login(data);
      setAuth({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8" data-testid="login-form">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Shipping Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Dashboard Login</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4" data-testid="login-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              placeholder="admin@dotlessagency.com"
              data-testid="login-email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              placeholder="Enter password"
              data-testid="login-password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="login-submit"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
