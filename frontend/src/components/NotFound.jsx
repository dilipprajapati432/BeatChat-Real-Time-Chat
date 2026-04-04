import { Home, ArrowLeft } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const NotFound = () => {
  const { user } = useAuthStore();

  const handleHomeClick = () => {
    window.location.href = user ? '/' : '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-6">
      <div className="max-w-md w-full p-8 text-center rounded-2xl border border-white/10 bg-[#0f1117] shadow-xl">
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-medium text-slate-300 mb-6">Page Not Found</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          
          <button 
            onClick={handleHomeClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Home size={16} />
            {user ? 'Go to Chat' : 'Go to Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
