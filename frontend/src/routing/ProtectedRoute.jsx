// src/routing/ProtectedRoute.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import AuthModal from "../components/AuthModal";

const GateScreen = ({ message, onLogin, onRegister, onBack }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div
        className="
          w-full max-w-md rounded-2xl border border-border
          bg-card/90 backdrop-blur-md p-6
          shadow-[var(--shadow-card)]
          text-foreground
        "
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-semibold">Sign in required</h2>
        </div>

        <p className="text-muted-foreground mb-6">
          {message || (
            <>
              You need to <span className="font-medium">login</span> or{" "}
              <span className="font-medium">create an account</span> to access the dashboard.
            </>
          )}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={onLogin}
            className="bg-primary/15 hover:bg-primary/25 border border-border text-foreground"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
          <Button
            onClick={onRegister}
            variant="secondary"
            className="text-foreground"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register
          </Button>
        </div>

        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground mt-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  if (initializing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  if (user) return children;

  const customMessage = location.state?.authMessage;

  return (
    <>
      <GateScreen
        message={customMessage}
        onLogin={() => {
          setAuthMode("login");
          setAuthOpen(true);
        }}
        onRegister={() => {
          setAuthMode("register");
          setAuthOpen(true);
        }}
        onBack={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
      />

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          const to = location?.pathname || "/dashboard";
          navigate(to, { replace: true });
        }}
      />
    </>
  );
};

export default ProtectedRoute;



