import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    usernameRef.current?.focus();
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-50 flex items-center justify-center p-6">
      {/* Main Container Card */}
      <div className="flex flex-col md:flex-row w-full max-w-4xl min-h-[550px] bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        
        {/* Left Side: Branding/Logo */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 border-4 border-white rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center flex-grow text-center md:text-left md:items-start">
            {/* Logo Placeholder */}
            <div className="w-32 h-32 bg-white rounded-full mb-8 flex items-center justify-center shadow-2xl p-2">
               {/* Replace with your actual DENR Logo asset */}
               <img 
                src="C:\Users\richm\Downloads\Inventory_Management\denr_logo.png" 
                alt="DENR Logo" 
                className="w-full h-full object-contain"
                onError={(e) => (e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Logo_of_the_Department_of_Environment_and_Natural_Resources.svg/3840px-Logo_of_the_Department_of_Environment_and_Natural_Resources.svg.png")}
               />
            </div>
            
            <h1 className="text-3xl font-extrabold leading-tight mb-4 tracking-tight text-white">
              Inventory Management Supply <br /> 
            </h1>
            
            <div className="w-12 h-1 bg-white mb-6" />
            
            <p className="text-sm font-light text-white/90 leading-relaxed">
              Department of Environment and Natural Resources <br />
              <span className="font-semibold">Cordillera Administrative Region</span>
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-[55%] p-10 md:p-16 flex flex-col justify-center bg-white/80 backdrop-blur-sm">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-green-800 mb-2">Welcome Back</h2>
              <p className="text-green-600 text-sm">Please sign in to the Inventory System</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-green-700">Username</Label>
                <Input
                  ref={usernameRef}
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/50 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-xs font-bold uppercase tracking-wider text-green-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 border-green-200 focus:border-green-500 focus:ring-green-500/50 rounded-lg"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Sign In
              </Button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
