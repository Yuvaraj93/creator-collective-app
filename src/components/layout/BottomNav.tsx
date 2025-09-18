import { Home, FileText, CheckSquare, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FileText, label: "Notes", path: "/notes" },
    { icon: CheckSquare, label: "Todos", path: "/todos" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-primary/20">
      <div className="flex items-center justify-around py-3 px-4 relative">
        {/* Glow line on top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        
        {navItems.map(({ icon: Icon, label, path }, index) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-300 relative group",
              location.pathname === path
                ? "text-primary bg-primary/20 scale-110"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105"
            )}
          >
            {/* Active indicator */}
            {location.pathname === path && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-px bg-primary animate-pulse"></div>
            )}
            
            <div className="relative">
              <Icon size={20} className={location.pathname === path ? "animate-pulse" : ""} />
              
              {/* Glow effect for active item */}
              {location.pathname === path && (
                <div className="absolute inset-0 bg-primary opacity-20 rounded-full blur-sm animate-pulse"></div>
              )}
            </div>
            
            <span className={cn(
              "text-xs font-mono tracking-wider transition-all duration-300",
              location.pathname === path ? "font-semibold" : "font-medium"
            )}>
              {label.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;