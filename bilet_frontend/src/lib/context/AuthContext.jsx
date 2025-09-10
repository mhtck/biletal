import React, { createContext, useState, useContext } from 'react';
import { useDispatch } from 'react-redux';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
   const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state) => state.auth)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    const token = tokenHandler.getToken()
    if (token) {
      dispatch(checkAuthStatus())
        .finally(() => setInitialCheckDone(true))
    } else {
      setInitialCheckDone(true)
    }
  }, [dispatch])

  if (!initialCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }


  return (
    <AuthContext.Provider value={{ isAuthenticated}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
