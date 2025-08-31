import { useState } from "react";
import { Button } from "../components/ui/button";
import { Cloud, Menu, LogOut, LayoutDashboard, User as UserIcon, ChevronDown } from "lucide-react";
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
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SkyWeather</h1>
              <p className="text-xs text-muted-foreground">Live Weather Updates</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-primary/90"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
             className="text-white/80 hover:text-white hover:bg-primary/90"
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
             className="text-white/80 hover:text-white hover:bg-primary/90"
              onClick={() => navigate("/about")}
            >
              About
            </Button>
          </nav>

          {/* Right side: Theme + Auth/User */}
          <div className="flex items-center space-x-1">
            {/* Uses WeatherContext.toggleTheme + state.theme */}
            {/* <ThemeToggleWeather /> */}

            {initializing ? (
              <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-primary/90 flex items-center gap-2"
                  >
                    <UserIcon className="h-4 w-4 opacity-80" />
                    <span className="max-w-[140px] truncate text-left text-white/80 hover:text-white ">
                      {user?.fullName || user?.username || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px] bg-white dark:bg-gray-800 text-foreground">
                  <DropdownMenuLabel className="truncate text-foreground">
                    {user?.email || "Signed in"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard")}
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-foreground hover:bg-muted"
                  onClick={() => openAuthModal("login")}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-primary/15 hover:bg-primary/25 text-foreground border-border"
                  onClick={() => openAuthModal("register")}
                >
                  Register
                </Button>
              </>
            )}

            {/* Mobile menu (placeholder) */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-foreground hover:bg-muted"
              aria-label="Open Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

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