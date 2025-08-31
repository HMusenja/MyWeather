// src/components/Header.jsx
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Cloud,
  Menu,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Home as HomeIcon,
  Info,
  User as UserIcon,
} from "lucide-react";
import AuthModal from "./AuthModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";

const Header = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const navigate = useNavigate();
  const { user, initializing, logout } = useAuth();

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MyWeather</h1>
              <p className="text-xs text-muted-foreground">
                Live Weather Updates
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
              onClick={() => navigate("/about")}
            >
              About
            </Button>
          </nav>

          {/* Right side: Menu with username when signed in */}
          <div className="flex items-center space-x-2">
            {initializing ? (
              <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
            ) : null}

            {user && (
              <div className="flex items-center gap-2 text-sm text-foreground truncate max-w-[150px]">
                <UserIcon className="h-4 w-4 opacity-80" />
                <span className="truncate">
                  { user?.username || "User"}
                </span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:bg-muted"
                  aria-label="Open Menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuLabel className="truncate">
                  {user
                    ? user?.email || user?.username || "Signed in"
                    : "Welcome — Quick Menu"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Core links */}
                <DropdownMenuItem
                  onClick={() => navigate("/")}
                  className="cursor-pointer"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/about")}
                  className="cursor-pointer"
                >
                  <Info className="h-4 w-4 mr-2" />
                  About
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Auth-aware actions */}
                {!user ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => openAuthModal("register")}
                      className="cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openAuthModal("login")}
                      className="cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Auth modal */}
      {!user && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      )}
    </header>
  );
};

export default Header;
