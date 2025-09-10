import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { tokenHandler } from "@/lib/utils/tokenHandler";
import { checkAuthStatus } from "../redux/authSlice";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, token, user } = useSelector(
    (state) => state.auth
  );
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = tokenHandler.getToken();

      if (!storedToken) {
        setHasChecked(true);
        return;
      }
      if (storedToken && !isAuthenticated && !loading && !hasChecked) {
        try {
          await dispatch(checkAuthStatus()).unwrap();
        } catch (error) {
          console.log("(register.js) Oturum başarısız: ", error);
          tokenHandler.removeToken();
        } finally {
          console.log("protect rout ", error);

          setHasChecked(true);
        }
      } else if (isAuthenticated) {
        setHasChecked(true);
      }
    };
    checkAuth();
  }, [dispatch, isAuthenticated, loading, hasChecked]);

  if (loading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (loading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !tokenHandler.getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
